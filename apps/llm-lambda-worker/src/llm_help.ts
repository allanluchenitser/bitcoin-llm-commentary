import { encoding_for_model, type TiktokenModel } from "tiktoken";
import { format } from "date-fns";

// https://developers.openai.com/api/docs/pricing

type GptPrice = { // in cents per million tokens
  input: number;
  output: number;
}

export const gptPricing: Record<string, GptPrice> = {
  "gpt-5.2": { input: 175, output: 1400},
  "gpt-5.1": { input: 125, output: 1000},
  "gpt-5-nano": { input: 5, output: 40 },
  "gpt-5-mini": { input: 25, output: 200 },
  "gpt-4": { input: 3000, output: 6000 },
}

type InferenceEstimate = {
  model: string;
  tokens: number;
  cents: number;
  dollars: string;
  dollars48: string;
  dollarsMonth: string;
}

export function inferenceCounts(model: string, promptText: string):  InferenceEstimate{
  const enc = encoding_for_model(model as TiktokenModel);
  const tokens = enc.encode(promptText).length;

  const cents = (tokens / 1000000) * gptPricing[model].input;
  const dollars = '$' + (cents / 100).toFixed(10);
  const dollars48 = '$' + ((cents * 48) / 100).toFixed(10); // for 48 summaries per day
  const dollarsMonth = '$' + ((cents * 48 * 30) / 100).toFixed(10); // for 48 summaries per day, 30 days in month

  return {
    model,
    tokens,
    cents,
    dollars,
    dollars48,
    dollarsMonth
  };
}

import crypto from "crypto";
function randomId(prefix: string) {
  return prefix + '_' + crypto.randomBytes(16).toString('hex');
}

/**
 * Generates a fake, but realistic, LLM response object for testing.
 * Optionally override the output_text.
 */

function fakePriceComment() {
  const comments = [
    "Bitcoin is showing strong bullish momentum, with a significant increase in trading volume.",
    "Bitcoin's price has been on a remarkable run, reaching new heights and attracting significant attention from both retail and institutional investors. The surge in price can be attributed to a combination of factors, including increased adoption by major companies, favorable regulatory developments, and a growing recognition of Bitcoin as a store of value. Technical analysis reveals that the current uptrend is robust, with key indicators such as the MACD and RSI showing strong bullish signals. However, it's important for traders to exercise caution, as the rapid price increase has also led to heightened volatility. Setting appropriate stop-loss levels and closely monitoring market conditions can help manage risk in this dynamic environment.",
    "The price has broken through a key resistance level, indicating potential for further gains.",
    "Technical indicators are signaling overbought conditions, suggesting a possible short-term pullback.",
    "Market sentiment is positive, with many traders expressing optimism about Bitcoin's future performance.",
    "The recent price action of Bitcoin has been characterized by a steady upward trajectory, with the asset breaking through several key resistance levels. This bullish momentum can be attributed to a variety of factors, including increased institutional adoption, favorable regulatory news, and a general shift in market sentiment towards cryptocurrencies. Technical indicators are currently showing strong bullish signals, with the MACD indicating positive momentum and the RSI approaching overbought territory. While the outlook remains positive, traders should remain vigilant for signs of a potential pullback, especially given the heightened volatility that often accompanies rapid price increases.",
    "Recent news about institutional adoption has contributed to the upward price movement.",
    "The Relative Strength Index (RSI) is approaching 70, which may indicate that the asset is becoming overvalued.",
    "Support levels have been holding well, providing a solid foundation for the current uptrend.",
    "There is increased volatility in the market, which could lead to rapid price fluctuations in the near term.",
    "Bitcoin has experienced a significant price surge over the past week, breaking through multiple resistance levels and reaching new all-time highs. The surge has been driven by a combination of factors, including increased institutional interest, positive regulatory developments, and growing mainstream adoption. Technical analysis indicates that the current uptrend is strong, with key indicators such as the Moving Average Convergence Divergence (MACD) and the Relative Strength Index (RSI) showing bullish signals. However, traders should be mindful of potential volatility and consider setting stop-loss orders to manage risk in case of a sudden market correction.",
    "Analysts are closely watching for any signs of a reversal, as the current trend has been quite strong.",
    "Overall, Bitcoin's price action suggests a bullish outlook, but traders should remain cautious of potential corrections."
  ];

  return comments[Math.floor(Math.random() * comments.length)];
}

export function makeFakeResponse(outputText?: string) {
  const now = Math.floor(Date.now() / 1000);
  const text = outputText || fakePriceComment();
  return {
    id: randomId('resp'),
    object: 'response',
    created_at: now,
    status: 'completed',
    background: false,
    billing: { payer: 'developer' },
    completed_at: now + 10,
    error: null,
    frequency_penalty: 0,
    incomplete_details: null,
    instructions: null,
    max_output_tokens: null,
    max_tool_calls: null,
    model: 'gpt-5-mini-2025-08-07',
    output: [
      {
        id: randomId('rs'),
        type: 'reasoning',
        summary: []
      },
      {
        id: randomId('msg'),
        type: 'message',
        status: 'completed',
        content: [text],
        role: 'assistant'
      }
    ],
    parallel_tool_calls: true,
    presence_penalty: 0,
    previous_response_id: null,
    prompt_cache_key: null,
    prompt_cache_retention: null,
    reasoning: { effort: 'medium', summary: null },
    safety_identifier: null,
    service_tier: 'default',
    store: true,
    temperature: 1,
    text: { format: { type: 'text' }, verbosity: 'medium' },
    tool_choice: 'auto',
    tools: [],
    top_logprobs: 0,
    top_p: 1,
    truncation: 'disabled',
    usage: {
      input_tokens: 123,
      input_tokens_details: { cached_tokens: 0 },
      output_tokens: 678,
      output_tokens_details: { reasoning_tokens: 832 },
      total_tokens: 801
    },
    user: null,
    metadata: {},
    output_text: text
  };
}

/**
 * Clears whitespace from beginning of new lines. (for prompt readability in code)
 */
export function dedent(text: string): string {
  const lines = text.replace(/^\n/, "").split("\n");
  const indents = lines
    .filter((l) => l.trim().length > 0)
    .map((l) => l.match(/^(\s*)/)?.[0].length ?? 0);

  const minIndent = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(minIndent)).join("\n").trimEnd();
}

import { type OHLCV } from "@blc/contracts";

export class CandleBuffer {
  private buf: OHLCV[] = [];

  constructor(private capacity: number) {
    if (capacity <= 0) throw new Error("capacity must be > 0");
  }

  push(c: OHLCV): void {
    this.buf.push(c);
    if (this.buf.length > this.capacity) this.buf.shift();
  }

  pushMany(cs: OHLCV[]): void {
    if (cs.length >= this.capacity) {
      this.buf = cs.slice(-this.capacity);
      return;
    }
    this.buf.push(...cs);
    while (this.buf.length > this.capacity) this.buf.shift();
  }

  last(n: number): OHLCV[] {
    if (n <= 0) return [];
    return this.buf.slice(-Math.min(n, this.buf.length));
  }

  size(): number {
    return this.buf.length;
  }

  clear(): void {
    this.buf.length = 0;
  }

  toArray(): OHLCV[] {
    return this.buf.slice();
  }
}

export function createCandleBuffer(capacity: number) {
  return new CandleBuffer(capacity);
}


export type CandleReport = {
  length: number; // how many candles were there?
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


export function calculateCandleReport(candles: OHLCV[]): CandleReport {
  if (!candles.length || Array.isArray(candles) === false) {
    throw new Error("No candles provided");
  }

  for (const c of candles) {
    console.log(c.ts, c.high, c.volume);
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
    length: n,
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