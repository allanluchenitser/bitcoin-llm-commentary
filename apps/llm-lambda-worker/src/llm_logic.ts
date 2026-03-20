import { OpenAI } from "openai";
import { PostgresClient } from "@blc/postgres-client";
import { OHLCV } from "@blc/contracts";
import { SseClients } from "@blc/sse-client";
import { color } from "@blc/color-logger";

import {
  DEFAULT_GENERATE_SUMMARY_OPTIONS,
  type GenerateSummaryOptions
} from "./config.js";

import {
  inferenceCounts,
  gptPricing,
  makeFakeResponse,
  dedent
} from "./llm_help.js";

import prompts from "./prompts.js";

import { promises as fs } from "fs";
import { format } from "date-fns";

const REGULAR_INTERVAL_CANDLES = 30;

export function buildUserPrompt(type: "regular" | "spike", candleReport: CandleReport): string {
  // if (candles.length > REGULAR_INTERVAL_CANDLES) {
  //   console.warn(`Number of candles (${candles.length}) exceeds the regular interval limit (${REGULAR_INTERVAL_CANDLES}). Consider reducing the number of candles or summarizing the data before sending to LLM.`);
  //   throw new Error("Too many candles for LLM input.");
  // }

  // const report = candleReport(candles);
  const reportString = JSON.stringify(candleReport, null, 2);

  switch (type) {
    case "regular":
      return dedent(`
        Summarize the interval below.

        Rules:
        ${prompts.summaryRules}

        Data:
        ${reportString}
      `);
    case "spike":
      return dedent(`
        Summarize the spike event below.

        Rules:
        ${prompts.spikeRules}

        Data:
        ${reportString}
      `);
    default:
      throw new Error(`Unknown summary type: ${type}`);
  }
}

type GenerateSummaryParams = {
  type: "regular" | "spike",
  candles: OHLCV[],
  openaiClient: OpenAI,
  pgClient: PostgresClient,
  sseClients?: SseClients,
  generateSummaryOptions?: Partial<GenerateSummaryOptions>;
}

/**
  calculates candles, generates a prompt, calls the LLM, saves to Postgres, broadcasts to SSE clients
*/
export async function generateSummary({
  type,
  candles,
  openaiClient,
  pgClient,
  sseClients,
  generateSummaryOptions
}: GenerateSummaryParams) {
  const options = { ...DEFAULT_GENERATE_SUMMARY_OPTIONS, ...generateSummaryOptions };

  /* ------ build prompts for LLM ------ */

  const developerPrompt = dedent(`
    Write a concise BTC/USD price action summary.
    3-5 sentences. No predictions. No advice. Use only provided values.
  `);

  if (candles.length > REGULAR_INTERVAL_CANDLES) {
    console.warn(`Number of candles (${candles.length}) exceeds the regular interval limit (${REGULAR_INTERVAL_CANDLES}). Consider reducing the number of candles or summarizing the data before sending to LLM.`);
    throw new Error("Too many candles for LLM input.");
  }

  const candleReportData = candleReport(candles);
  const userPrompt = buildUserPrompt(type, candleReportData);

  console.log('developerPrompt', developerPrompt);
  console.log('userPrompt', userPrompt);


  /* ------ estimate token cost  ------ */

  const estimateGpt5mini = inferenceCounts(options.modelName, userPrompt + developerPrompt);

  if (options.displayTokenUsageEstimates) {
    color.info("TOKEN COST ESTIMATES:");
    console.log(estimateGpt5mini);
  }

  if (estimateGpt5mini.tokens > 4000) {
    console.warn("Prompt token count exceeds typical LLM limits. Consider reducing the number of candles or summarizing the data before sending to LLM.");
    throw new Error("Prompt token count exceeds typical LLM limits.");
  }

  /* ------ launch LLM inference ------ */

  let response;
  try {
    if (options.useFakeResponse) {
      response = makeFakeResponse();
    }
    else {
      response = await openaiClient.responses.create({
        model: options.modelName,
        input: [
          { role: "developer", content: developerPrompt },
          { role: "user", content: userPrompt },
        ],
      });
    }
  }
  catch (err) {
    console.error("Error generating LLM summary:", err);
    return;
  }

  /* ------ log actual token usage ------ */

  if (options.displayTokenUsageActual && response.usage) {
    color.warn(`ACTUAL LLM usage for model ${response.model}`)
    console.log(response.usage);
    const actualCents = response.usage.total_tokens / 1000000 * gptPricing[options.modelName].input / 100;
    console.log(`Actual cost in dollars: ${actualCents.toFixed(10)}`);
  }

  if (options.saveLLMResponse) {
    const jsonLine = JSON.stringify(response) + "\n";

    try {
      await fs.appendFile("./openai_responses.jsonl", jsonLine, "utf-8");
      console.log('LLM line saved to openai_responses.jsonl');
    }
    catch (err) {
      console.error("Error writing OpenAI response to file:", err);
    }
  }

  /* ------ final: save to Postgres, broadcast to SSE ------ */


  // - Comment on volume. If volume.spikeRatio >= 2 call it a “volume spike”; if >= 1.3 call it “elevated”; otherwise “steady”.
  let volumeWord = "steady";
  if (candleReportData.volume.spikeRatio >= 2) {
    volumeWord = "volume spike";
  }
  else if (candleReportData.volume.spikeRatio >= 1.3) {
    volumeWord = "elevated";
  }

  let priceWord = "steady";
  if (candleReportData.price.changePct > 1) {
    priceWord = "upward";
  }
  else if (candleReportData.price.changePct < -1) {
    priceWord = "downward";
  }

  const commentaryObject = {
    summaryType: type,
    exchange: candles[0].exchange,
    symbol: candles[0].symbol,
    ts: new Date().toISOString(),
    commentary: response.output_text,
    volumeWord,
    priceWord,
  }

  if (options.saveSummaryToDb) {
    try {
      await pgClient.insertLLMCommentary({
        ...commentaryObject,
        llmUsed: process.env.LLM_MODEL_NAME || options.modelName
      });
    } catch (err) {
      console.error("Error inserting LLM commentary into Postgres:", err);
      return;
    }
  }

  if (sseClients) {
    try {
      sseClients?.messageAll("summary", {
        ...commentaryObject
      });
    }
    catch (err) {
      console.error("Error sending SSE summary message:", err);
    }
  }
}

type CandleReport = {
  exchange: string;
  symbol: string;
  start: string;
  end: string;
  numCandles: number;
  price: {
    open: number;
    close: number;
    high: number;
    low: number;
    change: number;
    changePct: number;
    range: number;
    rangePct: number;
  };
  volume: {
    total: number;
    average: number;
    max1m: number;
    spikeRatio: number;
  };
  candleCounts: {
    up: number;
    down: number;
    flat: number;
  };
  highlights?: {
    maxVolumeCandle: OHLCV;
    maxRangeCandle: OHLCV;
    maxBodyCandle: OHLCV;
  };
};

export function candleReport(candles: OHLCV[]): CandleReport {
  if (!candles.length || Array.isArray(candles) === false) {
    throw new Error("No candles provided");
  }

  const n = candles.length;
  const first = candles[0];
  const last = candles[n - 1];

  let hi = -Infinity;
  let lo = Infinity;
  let volTotal = 0;
  let volMax = -Infinity;

  let up = 0;
  let down = 0;
  let flat = 0;

  for (const c of candles) {
    if (c.high > hi) hi = c.high;
    if (c.low < lo) lo = c.low;
    volTotal += c.volume;
    if (c.volume > volMax) volMax = c.volume;
    if (c.close > c.open) up++;
    else if (c.close < c.open) down++;
    else flat++;
  }

  volTotal = Number(volTotal.toFixed(4));

  const o0 = Number(first.open.toFixed(2));
  const cn = Number(last.close.toFixed(2));
  const chg = Number((cn - o0).toFixed(2));
  const chg_pct = Number(((cn - o0) / o0 * 100).toFixed(2));
  const rangeTotal = Number((hi - lo).toFixed(2));
  const range_pct = Number(((hi - lo) / o0 * 100).toFixed(2));
  const volAvg = Number((volTotal / n).toFixed(4));
  const spike_ratio = Number((volMax / volAvg).toFixed(4));

  // Add human-readable date strings using date-fns
  const startHuman = format(new Date(first.ts), "MMM dd, HH:mm 'UTC'");
  const endHuman = format(new Date(last.ts), "MMM dd, HH:mm 'UTC'");

  return {
    exchange: first.exchange,
    symbol: first.symbol,
    start: startHuman,
    end: endHuman,
    numCandles: n,
    price: {
      open: o0,
      close: cn,
      high: hi,
      low: lo,
      change: chg,
      changePct: chg_pct,
      range: rangeTotal,
      rangePct: range_pct,
    },
    volume: {
      total: volTotal,
      average: volAvg,
      spikeRatio: spike_ratio,
      max1m: volMax,
    },
    candleCounts: {
      up,
      down,
      flat,
    },
    // highlights: undefined as any, // not used, but required by CandleReport type
  };
}






