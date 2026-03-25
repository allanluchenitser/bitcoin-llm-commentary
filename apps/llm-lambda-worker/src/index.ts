import "@blc/env";
import OpenAI from "openai";
import express from "express";

import { color } from "@blc/color-logger";
import setupRedis from "./llm_redis.js";

import {
  processOhlcvRows,
  type OHLCVRow,
} from "@blc/contracts";

import { pgConfig } from "./db/config.js";
import { PostgresClient } from "@blc/postgres-client";

import {
  SseClients,
  createSseRouter,
} from "@blc/sse-client";

import { executeSummaryWorkFlow } from "./gen/gen_summary.js";

import {
  CandleBuffer,
  createCandleBuffer,
  calculateCandleReport,
} from "./llm_help.js";

import { DEFAULT_INTERVAL_OPTIONS as intervalOptions } from "./config.js";

async function main() {
  const runtime = await bootstrap();
  const { pgClient, openaiClient, cleanupRedis, candleBuffer } = runtime;

  try {
    if (candleBuffer.size() >= intervalOptions.summaryLookbackCandles) {
      console.log('Launching initial summary generation upon startup...');

      const lastN = candleBuffer.last(intervalOptions.summaryLookbackCandles);
      const report = calculateCandleReport(lastN);

      await executeSummaryWorkFlow({
        type: "regular",
        candleReport: report,
        openaiClient,
        pgClient,
      });
    }
  }
  catch (error) {
    console.error('Error initializing LLM Lambda Worker:', error);
    process.exit(1);
  }
 /* ------ LLM summary intervals ------ */

  const scheduledSummariesTimer = startScheduledSummaryInterval(pgClient, openaiClient, candleBuffer);
  const spikeDetectionTimer = startScheduledSpikeDetectionInterval(pgClient, openaiClient, candleBuffer);

  /* ------ http, rest, SSE ------ */

  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const sseClients = new SseClients();
  app.use("/sse", createSseRouter('/summaries', sseClients));

  app.get("/llm/history", async (_req, res) => {
    if (!pgClient) {
      return res.status(500).json({ error: "Postgres client not initialized" });
    }

    try {
      const result = await pgClient.getLLMCommentary();
      res.json(result);
    } catch (error) {
      console.error('Error fetching history from Postgres:', error);
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

  app.use((err: unknown, _req: any, res: any, _next: any) => {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  });

  /* ------ start web server ------ */

  const port = Number(process.env.LLM_EXPRESS_PORT ?? 3002);

  const server = app.listen(port, () => {
    color.info(`lambda-server listening on http://localhost:${port}`);
  });

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  /* ------ HELPERS HELPERS HELPERS HELPERS HELPERS HELPERS HELPERS  ------ */

  type Runtime = {
    pgClient: PostgresClient;
    openaiClient: OpenAI;
    cleanupRedis: () => void;
    candleBuffer: CandleBuffer;
  };

  async function bootstrap(): Promise<Runtime> {
    const candleBuffer = createCandleBuffer(30);
    const cleanupRedis = await setupRedis(candleBuffer);

    const pgClient = new PostgresClient(pgConfig);
    const candleRows: OHLCVRow[] = await pgClient.getInstrumentHistory(
      "kraken",
      "BTC/USD",
      intervalOptions.summaryLookbackCandles
    );
    candleBuffer.pushMany(processOhlcvRows(candleRows));

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set in environment variables.");
    const openaiClient = new OpenAI({ apiKey });

    return { pgClient, openaiClient, cleanupRedis, candleBuffer };
  }

  async function shutdown() {
    console.log('LLM Lambda Worker shutting down...');

    clearInterval(scheduledSummariesTimer);
    clearInterval(spikeDetectionTimer);

    await server.close(() => {
      console.log('LLM Lambda Worker server closed.');
    });

    await cleanupRedis();

    Promise.all([
      pgClient?.end().catch(err => console.error('Error closing Postgres client:', err))
    ]).finally(() => {
      process.exit(0);
    });
  }

  let scheduleInFlight = false;
  function startScheduledSummaryInterval(pgClient: PostgresClient, openaiClient: OpenAI, candleBuffer: CandleBuffer) {
    return setInterval(async () => { // summary on scheduled intervals
      try {
        if (!pgClient) return;
        if (candleBuffer.size() === 0) {
          console.warn("No candle data available yet for regular summary generation.");
          return;
        };

        const lastN = candleBuffer.last(intervalOptions.summaryLookbackCandles);
        if (lastN.length === intervalOptions.summaryLookbackCandles && !scheduleInFlight) {
          scheduleInFlight = true;
          color.info('scheduled gen!');

          const report = calculateCandleReport(lastN);

          await executeSummaryWorkFlow({
            type: "regular",
            candleReport: report,
            openaiClient,
            pgClient,
            sseClients
          });
          scheduleInFlight = false;
        }
      }
      catch (err) {
        console.error("Error in scheduled summary generation:", err);
      }
    }, intervalOptions.summaryEverySeconds * 1000);
  }

  let spikeInFlight = false;
  function startScheduledSpikeDetectionInterval(pgClient: PostgresClient, openaiClient: OpenAI, candleBuffer: CandleBuffer) {
    return setInterval(async () => { // spike detection triggers a special summary
      try {
        if (!pgClient || candleBuffer.size() === 0) return;
        if (candleBuffer.size() === 0) {
          console.warn("No candle data available yet for spike detection.");
          return;
        };

        const lastN = candleBuffer.last(intervalOptions.spikeLookbackCandles);
        const report = calculateCandleReport(lastN);
        const isSpike = report.volume.spikeRatio >= 1.3 || Math.abs(report.price.changePct) > 0.7;

        if (isSpike && !spikeInFlight) {
          spikeInFlight = true;
          color.info('spike gen!');
          await executeSummaryWorkFlow({
            type: "spike",
            candleReport: report,
            openaiClient,
            pgClient,
            sseClients
          });
          spikeInFlight = false;
        }
      } catch (err) {
        console.error("Error in scheduled spike detection:", err);
      }
    }, intervalOptions.checkSpikeEverySeconds * 1000);
  }
}; // end of main

main().catch(err => {
  console.error('Error starting LLM Lambda Worker:', err);
  process.exit(1);
});

