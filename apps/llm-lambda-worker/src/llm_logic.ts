import { OpenAI } from "openai";
import { PostgresClient } from "@blc/postgres-client";
import { OHLCV } from "@blc/contracts";
import { SseClients } from "@blc/sse-client";
import { color } from "@blc/color-logger";

import {
  type AggregatedSummary,
  inferenceCounts,
  gptPricing,
  makeFakeResponse
} from "./llm_help.js";

import { promises as fs } from "fs";
import { format } from "date-fns";

const REGULAR_INTERVAL_CANDLES = process.env.REGULAR_INTERVAL_CANDLES
  ? Number(process.env.REGULAR_INTERVAL_CANDLES)
  : 30;

const DISK_LOG_LLM_RESPONSE = false;
const FAKE_LLM_RESPONSE = true;
const DISPLAY_ESTIMATES = false;
const DISPLAY_ACTUALS = false;
const SAVE_TO_DB = false;

function buildUserPrompt(type: "regular" | "spike", candles: OHLCV[]): string {
  if (candles.length > REGULAR_INTERVAL_CANDLES) {
    console.warn(`Number of candles (${candles.length}) exceeds the regular interval limit (${REGULAR_INTERVAL_CANDLES}). Consider reducing the number of candles or summarizing the data before sending to LLM.`);
    throw new Error("Too many candles for LLM input.");
  }

  const agg = aggregateOHLCV(candles);
  const aggString = JSON.stringify(agg, null, 2);

  return `
Summarize the interval below.

Rules:
- State net direction using price.change and price.changePct.
- Mention high/low and overall range.
- Comment on volume. If volume.spikeRatio >= 2 call it a “volume spike”; if >= 1.3 call it “elevated”; otherwise “steady”.
- Optionally reference candleCounts to describe buying vs selling pressure.

Data:
${aggString}
  `;
}

/**
 * Generates a BTC/USD price action summary using an LLM, saves the result to Postgres,
 * and optionally broadcasts the summary via SSE.
 *
 * @param {GenerateSummaryParams} params - The parameters for generating the summary.
 * @returns {Promise<void>} Resolves when the summary is generated, saved, and optionally broadcasted.
 */

type GenerateSummaryParams = {
  type: "regular" | "spike",
  candles: OHLCV[],
  openaiClient: OpenAI,
  pgClient: PostgresClient,
  sseClients?: SseClients
}

export async function launchSummary({
  type,
  candles,
  openaiClient,
  pgClient,
  sseClients
}: GenerateSummaryParams) {

  /* ------ build prompts for LLM ------ */

  const userPrompt = buildUserPrompt(type, candles);
  const developerPrompt = `
Write a concise BTC/USD price action summary.
3–5 sentences. No predictions. No advice. Use only provided values.
`
  /* ------ estimate inference then (maybe) make the LLM API call ------ */

  color.info(`launchSummary for ${candles.length} candles`);

  const estimateGpt5mini = inferenceCounts("gpt-5-mini", userPrompt + developerPrompt);

  if (DISPLAY_ESTIMATES) {
    color.info("INFERENCE COST ESTIMATES:");
    console.log(estimateGpt5mini);
  }

  if (estimateGpt5mini.tokens > 4000) {
    console.warn("Prompt token count exceeds typical LLM limits. Consider reducing the number of candles or summarizing the data before sending to LLM.");
    throw new Error("Prompt token count exceeds typical LLM limits.");
  }

  console.info('prompt ready for payload', { developerPrompt, userPrompt });

  let response;
  try {
    if (FAKE_LLM_RESPONSE) {
      response = makeFakeResponse();
    }
    else {
      response = await openaiClient.responses.create({
        model: "gpt-5-mini",
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

  /* ------ log actual usage and cost, which can differ from estimates ------ */

  if (DISPLAY_ACTUALS && response.usage) {
    color.warn(`ACTUAL LLM usage for model ${response.model}`)
    console.log(response.usage);
    const actualCents = response.usage.total_tokens / 1000000 * gptPricing["gpt-5-mini"].input / 100;
    console.log(`Actual cost in dollars: ${actualCents.toFixed(10)}`);
  }

  // console.log("LLM response object:", response);

  if (DISK_LOG_LLM_RESPONSE) {
    const jsonLine = JSON.stringify(response) + "\n";

    try {
      await fs.appendFile("./openai_responses.jsonl", jsonLine, "utf-8");
      console.log('LLM line saved to openai_responses.jsonl');
    }
    catch (err) {
      console.error("Error writing OpenAI response to file:", err);
    }
  }

  /* ------ save summary to Postgres and broadcast via SSE ------ */

  const commentaryObject = {
    summaryType: type,
    exchange: candles[0].exchange,
    symbol: candles[0].symbol,
    ts: candles[candles.length - 1].ts,
    commentary: response.output_text
  }

  if (SAVE_TO_DB) {
    try {
      await pgClient.insertLLMCommentary({
        ...commentaryObject,
        llmUsed: process.env.LLM_MODEL_NAME || "gpt-5-nano"
      });
    } catch (err) {
      console.error("Error inserting LLM commentary into Postgres:", err);
      return;
    }
  }

  // initial load probably won't have sseClients ready, so check before broadcasting

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

function aggregateOHLCV(candles: OHLCV[]): AggregatedSummary {
  if (!candles.length) {
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
    // highlights: undefined as any, // not used, but required by AggregatedSummary type
  };
}





