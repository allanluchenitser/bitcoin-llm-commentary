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
  highlights?: {
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
export function makeFakeResponse(outputText?: string) {
  const now = Math.floor(Date.now() / 1000);
  const text = outputText || "BTC/USD is moving in a volatile range today. Consider risk management strategies.";
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