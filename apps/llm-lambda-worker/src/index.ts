import "@blc/env";
import OpenAI from "openai";

import { createRedisClient, type RedisClient } from "@blc/redis-client";
import { subscriberLLM } from "./subscribe/subscriberLLM.js";
import { OHLCV, OHLCVRow } from "@blc/contracts";

import { pgConfig } from "./db/config.js";
import { PostgresClient } from "@blc/postgres-client";
import { differenceInMinutes, parseISO } from "date-fns";

console.log('LLM Lambda Worker starting...');

const candleDataBuffer: OHLCV[] = [];
let pgClient: PostgresClient | null = null;
let redis: RedisClient | null = null;

try {
  redis = createRedisClient();
  await redis.connect();
  console.log('LLM Lambda Worker connected to Redis.');

  pgClient = new PostgresClient(pgConfig);
  console.log('LLM Lambda Worker initialized Postgres client.');

  await subscriberLLM(redis);
  console.log('LLM Lambda Worker subscribed to Redis channel for LLM tasks.');
}
catch (error) {
  console.error('Error initializing LLM Lambda Worker:', error);
  process.exit(1);
}

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("OPENAI_API_KEY is not set in environment variables.");
  process.exit(1);
}

const client = new OpenAI({
  apiKey
});

// const models = await client.models.list();
// for (const model of models.data) {
//   console.log(`Model: ${model.id}`);
// }

try {
  /*
    roles:
    { role, content } // authority decreases in this order:

    - system: global premises

    // - developer: feature level premises. tool use rules.

    - user: the user's input
    - assistant: the assistant's response

    - tool: the tool's response

    { role, name, input }
    - function
  */
  const response = await client.responses.create({
      model: process.env.LLM_MODEL_NAME || "gpt-5-nano",
      // tools: [
      //     { type: "web_search" },
      // ],
      instructions: "Answer the question as concisely as possible.",

      // input: "Please explain the concept of Bitcoin in simple terms.",
      input: [
        {
          role: "user",
          content: "Please explain the concept of Bitcoin in simple terms."
        },
        {
          role: "developer",
          content: "The user is asking for a simple explanation of Bitcoin. Please provide a concise and easy-to-understand response."
        }
      ]
  });

  console.log(response.output_text);
}
catch (error) {
    console.error("Error creating response:", error);
    process.exit(1);
}

const REGULAR_INTERVAL_MINUTES = 30;
const SPIKE_INTERVAL_MINUTES = 10;
const PRICE_SPIKE_THRESHOLD = 0.03; // 3%
const VOLUME_SPIKE_MULTIPLIER = 3;  // 3x average

function getIntervalCandles(buffer: OHLCV[], minutes: number): OHLCV[] {
  return buffer.slice(-minutes);
}

function detectSpike(candles: OHLCV[]): boolean {
  if (candles.length === 0) return false;
  const first = candles[0];
  const last = candles[candles.length - 1];
  const priceChange = Math.abs(last.close - first.open) / first.open;
  const avgVolume = candles.reduce((sum, c) => sum + c.volume, 0) / candles.length;
  return priceChange > PRICE_SPIKE_THRESHOLD || last.volume > avgVolume * VOLUME_SPIKE_MULTIPLIER;
}

function buildPrompt(type: "regular" | "spike", candles: OHLCV[]): string {
  const interval = `${candles[0].ts} to ${candles[candles.length - 1].ts}`;
  const jsonData = JSON.stringify(candles, null, 2);
  return `
Summarize the price and volume movement for BTC/USD from ${interval}.
Here is the full OHLCV data for this interval:
${jsonData}
${type === "spike" ? "Note: There was a dramatic move in price or volume. Focus on explaining the spike." : ""}
Please provide a concise, insightful summary.
  `;
}

async function generateSummary(
  type: "regular" | "spike",
  candles: OHLCV[],
  client: OpenAI,
  pgClient: PostgresClient
) {
  const prompt = buildPrompt(type, candles);
  const response = await client.responses.create({
    model: process.env.LLM_MODEL_NAME || "gpt-5-nano",
    instructions: "Summarize price and volume movement concisely.",
    input: [{ role: "user", content: prompt }]
  });
  await pgClient.saveLLMCommentary({
    commentary: response.output_text,
    summaryType: type,
    exchange: candles[0].exchange,
    symbol: candles[0].symbol,
    ts: candles[candles.length - 1].ts,
    llmUsed: process.env.LLM_MODEL_NAME || "gpt-5-nano"
  });
}

// --- INTERVAL LOGIC ---
// Regular 30-minute summary
setInterval(async () => {
  if (!pgClient) return;
  const last30 = getIntervalCandles(candleDataBuffer, REGULAR_INTERVAL_MINUTES);
  if (last30.length === REGULAR_INTERVAL_MINUTES) {
    await generateSummary("regular", last30, client, pgClient);
  }
}, REGULAR_INTERVAL_MINUTES * 60 * 1000);

// Spike-triggered 10-minute summary
setInterval(async () => {
  if (!pgClient) return;
  const last10 = getIntervalCandles(candleDataBuffer, SPIKE_INTERVAL_MINUTES);
  if (last10.length === SPIKE_INTERVAL_MINUTES && detectSpike(last10)) {
    await generateSummary("spike", last10, client, pgClient);
  }
}, 60 * 1000);



