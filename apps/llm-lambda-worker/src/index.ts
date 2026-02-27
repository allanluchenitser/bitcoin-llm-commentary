import "@blc/env";
import OpenAI from "openai";
import express from "express";

import { color } from "@blc/color-logger";
import { createRedisClient, type RedisClient } from "@blc/redis-client";

import {
  CHANNEL_TICKER_OHLCV,
  ohlcvRow2Num,
  type OHLCV,
  type OHLCVRow
} from "@blc/contracts";

import { pgConfig } from "./db/config.js";
import { PostgresClient } from "@blc/postgres-client";

import {
  SseClients,
  createSseRouter,
} from "@blc/sse-client";

import { launchSummary } from "./llm_logic.js";

console.log('LLM Lambda Worker starting...');

const candleDataBuffer: OHLCV[] = [];
let pgClient: PostgresClient | null = null;
let redis: RedisClient | null = null;
let openaiClient: OpenAI | null = null;

try {
  redis = createRedisClient();
  await redis.connect();
  console.log('LLM Lambda Worker connected to Redis.');

  pgClient = new PostgresClient(pgConfig);
  console.log('LLM Lambda Worker initialized Postgres client.');

  await redis.connect();

  await redis.subscribe(CHANNEL_TICKER_OHLCV, (message: string) => {
    const row = JSON.parse(message) as OHLCVRow;
    const data = ohlcvRow2Num(row);
    candleDataBuffer.push(data);
  });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not set in environment variables.");
    process.exit(1);
  }
  openaiClient = new OpenAI({ apiKey });

  console.log('LLM Lambda Worker subscribed to Redis channel for LLM tasks.');
}
catch (error) {
  console.error('Error initializing LLM Lambda Worker:', error);
  process.exit(1);
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ------ sse setup ------ */

const sseClients = new SseClients();
app.use("/sse", createSseRouter('/summaries', sseClients));

/* ------ error routes ------ */

app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

app.use((err: unknown, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

/* ------ llm summary intervals ------ */

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

// scheduled 30-minute summary
setInterval(async () => {
  if (!pgClient) return;
  const last30 = getIntervalCandles(candleDataBuffer, REGULAR_INTERVAL_MINUTES);
  if (last30.length === REGULAR_INTERVAL_MINUTES) {
    await launchSummary({
      type: "regular",
      candles: last30,
      openaiClient,
      pgClient,
      sseClients
    });
  }
}, REGULAR_INTERVAL_MINUTES * 60 * 1000);

// spike detection every minute
setInterval(async () => {
  if (!pgClient) return;
  const last10 = getIntervalCandles(candleDataBuffer, SPIKE_INTERVAL_MINUTES);
  if (last10.length === SPIKE_INTERVAL_MINUTES && detectSpike(last10)) {
    await launchSummary({
      type: "spike",
      candles: last10,
      openaiClient,
      pgClient,
      sseClients
    });
  }
}, 60 * 1000);

/* ------ start web server ------ */

const port = Number(process.env.PORT ?? 3000);

const server = app.listen(port, () => {
  color.info(`web-api listening on http://localhost:${port}`);
});

/* ------ cleanup ------ */

async function shutdown() {
  console.log('LLM Lambda Worker shutting down...');

  server.close(() => {
    console.log('LLM Lambda Worker server closed.');
  });

  Promise.all([
    redis?.disconnect().catch(err => console.error('Error disconnecting Redis:', err)),
    pgClient?.end().catch(err => console.error('Error closing Postgres client:', err))
  ]).finally(() => {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
