import "@blc/env";
import OpenAI from "openai";
import express from "express";

import { color } from "@blc/color-logger";
import setupRedis from "./llm_redis.js";

import {
  ohclvRows2Numbers,
  type OHLCV,
} from "@blc/contracts";

import { pgConfig } from "./db/config.js";
import { PostgresClient } from "@blc/postgres-client";

import {
  SseClients,
  createSseRouter,
} from "@blc/sse-client";

import { generateSummary } from "./llm_logic.js";
import { CandleBuffer, createCandleBuffer } from "./llm_help.js";
import { DEFAULT_INTERVAL_OPTIONS as options } from "./workerConfig.js";


let pgClient: PostgresClient | null = null;
let openaiClient: OpenAI | null = null;

let cleanupRedis: (() => void) = () => {};
const candleBuffer: CandleBuffer = createCandleBuffer(30);

console.log('LLM Lambda Worker starting...');
try {
  /* ------ redis subscription to populate candleBuffer with OHLCV data ------ */
  cleanupRedis = await setupRedis(candleBuffer);

  /* ------ connect to Postgres for summaries in DB ------ */
  pgClient = new PostgresClient(pgConfig);
  const initialCandles = await pgClient.getInstrumentHistory("kraken", "BTC/USD", options.summaryIntervalSeconds);
  candleBuffer.pushMany(ohclvRows2Numbers(initialCandles));

  console.log(`LLM Lambda Worker connected to Postgres and loaded initial OHLCV data: ${initialCandles.length} candles.`);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not set in environment variables.");
    process.exit(1);
  }
  openaiClient = new OpenAI({ apiKey });
  console.log('LLM Lambda Worker initialized OpenAI client.');

  if (candleBuffer.size() >= options.summaryIntervalSeconds) {
    console.log('Launching initial summary generation upon startup...');

    await generateSummary({
      type: "regular",
      candles: candleBuffer.last(options.summaryIntervalSeconds),
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
    // console.log('Fetched LLM history:', result);
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
  if (candleBuffer.size() === 0) {
    console.warn("No candle data available yet for regular summary generation.");
    return;
  };



  const last30 = candleBuffer.last(options.summaryIntervalSeconds);
  if (last30.length === options.summaryIntervalSeconds) {
    color.info('scheduled gen!');
    await generateSummary({
      type: "regular",
      candles: last30,
      openaiClient,
      pgClient,
      sseClients
    });
  }
}, options.summaryIntervalSeconds * 1000);

const spikeDetectionTimer = setInterval(async () => { // spike detection triggers a special summary
  if (!pgClient) return;
  if (candleBuffer.size() === 0) {
    console.warn("No candle data available yet for spike detection.");
    return;
  };

  console.log('spike check');

  const last10 = candleBuffer.last(options.spikeIntervalSeconds);
  if (last10.length === options.spikeIntervalSeconds && detectSpike(last10)) {
    color.info('spike gen!');
    await generateSummary({
      type: "spike",
      candles: last10,
      openaiClient,
      pgClient,
      sseClients
    });
  }
}, options.spikeIntervalSeconds * 1000);

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

  await cleanupRedis();

  Promise.all([
    pgClient?.end().catch(err => console.error('Error closing Postgres client:', err))
  ]).finally(() => {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
