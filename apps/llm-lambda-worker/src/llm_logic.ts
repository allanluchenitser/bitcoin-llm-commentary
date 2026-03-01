import { OpenAI } from "openai";
import { PostgresClient } from "@blc/postgres-client";
import { OHLCV } from "@blc/contracts";
import { SseClients} from "@blc/sse-client";
import { encoding_for_model, type TiktokenModel } from "tiktoken";
import { color } from "@blc/color-logger";

const REGULAR_INTERVAL_CANDLES = process.env.REGULAR_INTERVAL_CANDLES
  ? Number(process.env.REGULAR_INTERVAL_CANDLES)
  : 30;

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

type GenerateSummaryParams = {
  type: "regular" | "spike",
  candles: OHLCV[],
  openaiClient: OpenAI,
  pgClient: PostgresClient,
  sseClients?: SseClients
}

/* ------ generates, saves, and broadcasts summary via sse ------ */

export async function launchSummary({
  type,
  candles,
  openaiClient,
  pgClient,
  sseClients
}: GenerateSummaryParams) {

  const userPrompt = buildUserPrompt(type, candles);
  const developerPrompt = `
Write a concise BTC/USD price action summary.
3–5 sentences. No predictions. No advice. Use only provided values.
`

  const enc = encoding_for_model(process.env.LLM_MODEL_NAME as TiktokenModel || "gpt-5-nano");
  const tokenCount = enc.encode(userPrompt + developerPrompt).length;
  color.info(`Generated prompt with ${tokenCount} tokens for ${candles.length} candles.`);
  color.info("Developer prompt:", developerPrompt);
  color.info("User prompt:", userPrompt);

  return;

  if (tokenCount > 4000) {
    console.warn("Prompt token count exceeds typical LLM limits. Consider reducing the number of candles or summarizing the data before sending to LLM.");
    throw new Error("Prompt token count exceeds typical LLM limits.");
  }

  const response = await openaiClient.responses.create({
    model: process.env.LLM_MODEL_NAME || "gpt-5-nano",
    input: [
      { role: "developer", content: developerPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  console.log(`LLM usage for model ${response.model}`)
  console.log(response.usage);

  const commentaryObject = {
    summaryType: type,
    exchange: candles[0].exchange,
    symbol: candles[0].symbol,
    ts: candles[candles.length - 1].ts,
    commentary: response.output_text
  }

  try {
    await pgClient.insertLLMCommentary({
      ...commentaryObject,
      llmUsed: process.env.LLM_MODEL_NAME || "gpt-5-nano"
    });
  } catch (err) {
    console.error("Error inserting LLM commentary into Postgres:", err);
    return;
  }

  // initial load might not have any clients connected yet, so check before broadcasting
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

  let maxVolCandle = first;
  let maxRangeCandle = first;
  let maxBodyCandle = first;

  let maxRange = -Infinity;
  let maxBody = -Infinity;

  for (const c of candles) {
    // High / Low
    if (c.high > hi) hi = c.high;
    if (c.low < lo) lo = c.low;

    // Volume
    volTotal += c.volume;
    if (c.volume > volMax) {
      volMax = c.volume;
      maxVolCandle = c;
    }

    // Direction
    if (c.close > c.open) up++;
    else if (c.close < c.open) down++;
    else flat++;

    // Range
    const range = c.high - c.low;
    if (range > maxRange) {
      maxRange = range;
      maxRangeCandle = c;
    }

    // Body
    const body = Math.abs(c.close - c.open);
    if (body > maxBody) {
      maxBody = body;
      maxBodyCandle = c;
    }
  }

  const o0 = first.open;
  const cn = last.close;

  const chg = cn - o0;
  const chg_pct = (chg / o0) * 100;

  const rangeTotal = hi - lo;
  const range_pct = (rangeTotal / o0) * 100;

  const volAvg = volTotal / n;
  const spike_ratio = volMax / volAvg;

    return {
      exchange: first.exchange,
      symbol: first.symbol,
      start: first.ts,
      end: last.ts,
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
        max1m: volMax,
        spikeRatio: spike_ratio,
      },
      candleCounts: {
        up,
        down,
        flat,
      },
      highlights: {
        maxVolumeCandle: maxVolCandle,
        maxRangeCandle: maxRangeCandle,
        maxBodyCandle: maxBodyCandle,
      },
    };
}


export type AggregatedSummary = {
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
  highlights: {
    maxVolumeCandle: OHLCV;
    maxRangeCandle: OHLCV;
    maxBodyCandle: OHLCV;
  };
};


