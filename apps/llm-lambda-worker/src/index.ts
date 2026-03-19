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

import { generateSummary } from "./llm_logic.js";
import { DEFAULT_INTERVAL_OPTIONS as options } from "./workerConfig.js";

const candleDataBuffer: OHLCV[] = [];

let pgClient: PostgresClient | null = null;
let redis: RedisClient | null = null;
let openaiClient: OpenAI | null = null;

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

  /* ------ connect to Postgres for summaries in DB ------ */

  pgClient = new PostgresClient(pgConfig);
  const initialCandles = await pgClient.getInstrumentHistory("kraken", "BTC/USD", options.summaryIntervalMinutes);
  candleDataBuffer.push(...ohclvRows2Numbers(initialCandles));

  console.log(`LLM Lambda Worker connected to Postgres and loaded initial OHLCV data: ${initialCandles.length} candles.`);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not set in environment variables.");
    process.exit(1);
  }

  openaiClient = new OpenAI({ apiKey });
  console.log('LLM Lambda Worker initialized OpenAI client.');

  if (candleDataBuffer.length >= options.summaryIntervalMinutes) {
    console.log('Launching initial summary generation upon startup...');

    await generateSummary({
      type: "regular",
      candles: candleDataBuffer.slice(-options.summaryIntervalMinutes),
      openaiClient,
      pgClient,
    });
  }
}
catch (error) {
  console.error('Error initializing LLM Lambda Worker:', error);
  process.exit(1);
}

/* ------ http and middleware setup ------ */

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

/* ------ catchall rest routes ------ */

app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

app.use((err: unknown, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

/* ------ LLM summary intervals ------ */

/*
  Summary can be called via scheduled intervals or triggered by spike detection logic.

  llm summary intervals read and assess from candleDataBuffer which
  is populated by a redis subscription to the OHLCV data feed.
*/

function getIntervalCandles(buffer: OHLCV[], minutes: number): OHLCV[] {
  return buffer.slice(-minutes);
}

function detectSpike(candles: OHLCV[]): boolean {
  if (candles.length === 0) return false;
  const first = candles[0];
  const last = candles[candles.length - 1];
  const priceChange = Math.abs(last.close - first.open) / first.open;
  const avgVolume = candles.reduce((sum, c) => sum + c.volume, 0) / candles.length;
  return priceChange > options.priceSpikeThreshold || last.volume > avgVolume * options.volumeSpikeMultiplier;
}

const scheduledSummariesTimer = setInterval(async () => { // summary on scheduled intervals
  if (!pgClient) return;
  if (candleDataBuffer.length === 0) {
    console.warn("No candle data available yet for regular summary generation.");
    return;
  };
  const last30 = getIntervalCandles(candleDataBuffer, options.summaryIntervalMinutes);
  if (last30.length === options.summaryIntervalMinutes) {
    await generateSummary({
      type: "regular",
      candles: last30,
      openaiClient,
      pgClient,
      sseClients
    });
  }
}, options.summaryIntervalMinutes * 60 * 1000);

const spikeDetectionTimer = setInterval(async () => { // spike detection triggers a special summary
  if (!pgClient) return;
  if (candleDataBuffer.length === 0) {
    console.warn("No candle data available yet for spike detection.");
    return;
  };

  const last10 = getIntervalCandles(candleDataBuffer, options.spikeIntervalMinutes);
  if (last10.length === options.spikeIntervalMinutes && detectSpike(last10)) {
    await generateSummary({
      type: "spike",
      candles: last10,
      openaiClient,
      pgClient,
      sseClients
    });
  }
}, options.spikeIntervalMinutes * 60 * 1000);

/* ------ start web server ------ */

const port = Number(process.env.LLM_EXPRESS_PORT ?? 3002);

const server = app.listen(port, () => {
  color.info(`lambda-server listening on http://localhost:${port}`);
});

/* ------ cleanup ------ */

async function shutdown() {
  console.log('LLM Lambda Worker shutting down...');

  clearInterval(scheduledSummariesTimer);
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
