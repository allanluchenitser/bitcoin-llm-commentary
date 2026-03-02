import { type OHLCV } from "@blc/contracts";
import { encoding_for_model, type TiktokenModel } from "tiktoken";
import { color } from "@blc/color-logger";

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

// https://developers.openai.com/api/docs/pricing

type GptPrice = { // in cents per million tokens
  input: number;
  output: number;
}

export const gptPricing: Record<string, GptPrice> = {
  "gpt-5-nano": { input: 5, output: 40 },
  "gpt-5-mini": { input: 25, output: 200 },
}

type InferenceEstimateParams = {
  model: TiktokenModel;
  promptText: string;
}

type InferenceEstimate = {
  model: string;
  tokens: number;
  cents: number;
  dollars: string;
}

export function intferenceCounts(model: string, promptText: string):  InferenceEstimate{
  const enc = encoding_for_model(model as TiktokenModel);
  const tokens = enc.encode(promptText).length;

  const cents = (tokens / 1000000) * gptPricing[model].input;
  const dollars = (cents / 100).toFixed(10);
  return {
    model,
    tokens,
    cents,
    dollars,
  };
}