import "@blc/env";
import OpenAI from "openai";
import express from "express";

import { color } from "@blc/color-logger";
import { createRedisClient, type RedisClient } from "@blc/redis-client";

import {
  CHANNEL_TICKER_OHLCV,
  ohclvRows2Numbers,
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

const candleDataBuffer: OHLCV[] = [];

let pgClient: PostgresClient | null = null;
let redis: RedisClient | null = null;
let openaiClient: OpenAI | null = null;

const SUMMARY_INTERVAL_MINUTES = process.env.SUMMARY_INTERVAL_MINUTES
  ? Number(process.env.SUMMARY_INTERVAL_MINUTES)
  : 30;

console.log('LLM Lambda Worker starting...');

try {
  /* ------ connect to redis to receive OHLCV data ------ */

  redis = createRedisClient();
  await redis.connect();

  await redis.subscribe(CHANNEL_TICKER_OHLCV, (message: string) => {
    const row = JSON.parse(message) as OHLCVRow;
    const data = ohlcvRow2Num(row);
    candleDataBuffer.push(data);
  });

  console.log('LLM Lambda Worker subscribed to Redis channel for OHLCV data.');

  /* ------ connect to Postgres to save and serve up LLM commentary ------ */

  pgClient = new PostgresClient(pgConfig);
  const initialCandles = await pgClient.getInstrumentHistory("kraken", "BTC/USD", SUMMARY_INTERVAL_MINUTES);
  candleDataBuffer.push(...ohclvRows2Numbers(initialCandles));

  console.log(`LLM Lambda Worker connected to Postgres and loaded initial OHLCV data: ${initialCandles.length} candles.`);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not set in environment variables.");
    process.exit(1);
  }

  openaiClient = new OpenAI({ apiKey });
  console.log('LLM Lambda Worker initialized OpenAI client.');

  if (candleDataBuffer.length >= SUMMARY_INTERVAL_MINUTES) {
    console.log('Launching initial summary generation upon startup...');

    await launchSummary({
      type: "regular",
      candles: candleDataBuffer.slice(-SUMMARY_INTERVAL_MINUTES),
      openaiClient,
      pgClient,
    });
  }
}
catch (error) {
  console.error('Error initializing LLM Lambda Worker:', error);
  process.exit(1);
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ------ sse setup, for web client ------ */

const sseClients = new SseClients();
app.use("/sse", createSseRouter('/summaries', sseClients));

/* ------ rest routes ------ */

app.get("/llm/history", async (_req, res) => {
  if (!pgClient) {
    return res.status(500).json({ error: "Postgres client not initialized" });
  }

  try {
    const result = await pgClient.getLLMCommentary();
    console.log('Fetched LLM history:', result);
    res.json(result);
  } catch (error) {
    console.error('Error fetching history from Postgres:', error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

/* ------ error routes ------ */

app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

app.use((err: unknown, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

/* ------ LLM summary intervals ------ */

/*
  llm summary intervals read and assess from candleDataBuffer,
  the ever-populating redis subscription buffer.
*/

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

const scheduledTimer = setInterval(async () => { // summary on scheduled intervals
  if (!pgClient) return;
  if (candleDataBuffer.length === 0) {
    console.warn("No candle data available yet for regular summary generation.");
    return;
  };
  const last30 = getIntervalCandles(candleDataBuffer, SUMMARY_INTERVAL_MINUTES);
  if (last30.length === SUMMARY_INTERVAL_MINUTES) {
    await launchSummary({
      type: "regular",
      candles: last30,
      openaiClient,
      pgClient,
      sseClients
    });
  }
}, SUMMARY_INTERVAL_MINUTES * 60 * 1000);

const spikeDetectionTimer = setInterval(async () => { // spike detection triggers a special summary
  if (!pgClient) return;
  if (candleDataBuffer.length === 0) {
    console.warn("No candle data available yet for spike detection.");
    return;
  };

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
}, SUMMARY_INTERVAL_MINUTES * 60 * 1000);

/* ------ start web server ------ */

const port = Number(process.env.LLM_EXPRESS_PORT ?? 3002);

const server = app.listen(port, () => {
  color.info(`lambda-server listening on http://localhost:${port}`);
});

/* ------ cleanup ------ */

async function shutdown() {
  console.log('LLM Lambda Worker shutting down...');

  clearInterval(scheduledTimer);
  clearInterval(spikeDetectionTimer);

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
