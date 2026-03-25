import { OpenAI } from "openai";
import { PostgresClient } from "@blc/postgres-client";
import { OHLCV, LLMCommentary } from "@blc/contracts";
import { SseClients } from "@blc/sse-client";
import { color } from "@blc/color-logger";

import {
  DEFAULT_GENERATE_SUMMARY_OPTIONS,
  type GenerateSummaryOptions
} from "../config.js";

import {
  inferenceCounts,
  gptPricing,
  makeFakeResponse,
  dedent
} from "./gen_help.js";

import prompts from "../prompts.js";

import { promises as fs } from "fs";
import { type CandleReport } from "../llm_help.js";

function validateCandleCount(candleReport: CandleReport, maxSummaryCandles: number = DEFAULT_GENERATE_SUMMARY_OPTIONS.maxSummaryCandles) {
  if (candleReport.length > maxSummaryCandles) {
    console.warn(`Number of candles (${candleReport.length}) exceeds the regular interval limit (${maxSummaryCandles}). Consider reducing the number of candles or summarizing the data before sending to LLM.`);
    throw new Error("Too many candles for LLM input.");
  }
}

function estimateTokenUsage(prompt: string, options: GenerateSummaryOptions) {
  const estimate = inferenceCounts(options.modelName, prompt);

  if (estimate.tokens > 4000) {
    console.warn("Prompt token count exceeds typical LLM limits. Consider reducing the number of candles or summarizing the data before sending to LLM.");
    throw new Error("Prompt token count exceeds typical LLM limits.");
  }

  if (options.displayTokenUsageEstimates) {
    color.info("TOKEN COST ESTIMATES:");
    console.log(estimate.tokens);
  }
  return estimate;
}

function buildPrompts(type: "regular" | "spike", candleReport: CandleReport): { developerPrompt: string; userPrompt: string; }
{
  const reportString = JSON.stringify(candleReport, null, 2);

  let userPrompt;

  switch (type) {
    case "regular":
      userPrompt = dedent(`
        Summarize the interval below.

        Rules:
        ${prompts.summaryRules}

        Data:
        ${reportString}
      `);
      break;
    case "spike":
      userPrompt = dedent(`
        Summarize the spike event below.

        Rules:
        ${prompts.spikeRules}

        Data:
        ${reportString}
      `);
      break;
    default:
      throw new Error(`Unknown summary type: ${type}`);
  }

  return {
    developerPrompt: DEFAULT_GENERATE_SUMMARY_OPTIONS.developerPrompt,
    userPrompt
  };
}

async function runLLMInference(
  developerPrompt: string,
  userPrompt: string,
  options: GenerateSummaryOptions,
  openaiClient: OpenAI
): Promise<OpenAI.Responses.Response> {
  try {
    if (options.useFakeResponse) {
      return makeFakeResponse();
    }
    else {
      return openaiClient.responses.create({
        model: options.modelName,
        input: [
          { role: "developer", content: developerPrompt },
          { role: "user", content: userPrompt },
        ],
      });
    }
  }
  catch (err) {
    console.error("Error during LLM inference:", err);
    throw err;
  }
}

function logTokenUsage(options: GenerateSummaryOptions, response: OpenAI.Responses.Response) {
  if (options.displayTokenUsageActual && response.usage) {
    color.warn(`actual LLM usage for model ${response.model}`)
    console.log(response.usage);
    const actualCents = response.usage.total_tokens / 1000000 * gptPricing[options.modelName].input / 100;
    console.log(`Actual cost in dollars: ${actualCents.toFixed(10)}`);
    return true;
  }
  return false;
}

async function saveLLMResponseToFile(options: GenerateSummaryOptions, response: OpenAI.Responses.Response) {
  if (options.saveLLMResponse) {
    const jsonLine = JSON.stringify(response) + "\n";

    try {
      await fs.appendFile("./openai_responses.jsonl", jsonLine, "utf-8");
      console.log('LLM line saved to openai_responses.jsonl');
      return true;
    }
    catch (err) {
      console.error("Error writing OpenAI response to file:", err);
      return false;
    }
  }
  return false;
}

type BuildCommentaryObjectParams = {
  type: "regular" | "spike",
  candleReport: CandleReport,
  response: OpenAI.Responses.Response,
  options: GenerateSummaryOptions
}

function buildCommentaryObject(
  { type, candleReport, response, options }: BuildCommentaryObjectParams
): LLMCommentary {
  return {
    summaryType: type,
    exchange: candleReport.exchange,
    symbol: candleReport.symbol,
    ts: new Date().toISOString(),
    commentary: response.output_text,
    llmUsed: process.env.LLM_MODEL_NAME || options.modelName,
    spikeRatio: candleReport.volume.spikeRatio,
    changePercent: candleReport.price.changePct,
  }
}

type GenerateSummaryParams = {
  type: "regular" | "spike",
  candleReport: CandleReport,
  openaiClient: OpenAI,
  pgClient: PostgresClient,
  sseClients?: SseClients,
  generateSummaryOptions?: Partial<GenerateSummaryOptions>;
}

/**
  calculates candles, generates a prompt, calls the LLM, saves to Postgres, broadcasts to SSE clients
*/
export async function executeSummaryWorkFlow({
  type,
  candleReport,
  openaiClient,
  pgClient,
  sseClients,
  generateSummaryOptions
}: GenerateSummaryParams) {
  const options = { ...DEFAULT_GENERATE_SUMMARY_OPTIONS, ...generateSummaryOptions };

  // throws if report.length is too big
  validateCandleCount(candleReport);

  // throws if the prompt type is not recognized
  const { developerPrompt, userPrompt } = buildPrompts(type, candleReport);

  // throws if token count is too high
  estimateTokenUsage(developerPrompt + userPrompt, options)

  // throws if the LLM inference fails
  const response = await runLLMInference(developerPrompt, userPrompt, options, openaiClient)

  logTokenUsage(options, response);

  // catches if the file write fails
  await saveLLMResponseToFile(options, response);

  // no error checking
  const commentaryObject = buildCommentaryObject({ type, candleReport, response, options })

  /* --- broadcast to SSE. send to database --- */

  if (sseClients) {
    try {
      sseClients?.messageAll("summary", {
        ...commentaryObject,
        ...candleReport
      });
    }
    catch (err) {
      console.error("Error sending SSE summary message:", err);
    }
  }

  if (options.saveSummaryToDb) {
    try {
      await pgClient.insertLLMCommentary(commentaryObject);
    }
    catch (err) {
      console.error("Error inserting LLM commentary into Postgres:", err);
    }
  }
}


