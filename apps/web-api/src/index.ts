import "@blc/env";
import express from "express";

import { color } from "@blc/color-logger";
import { createRedisClient, type RedisClient } from "@blc/redis-client";

import { createSseRouter } from "./sse/sseRouter.js";
import { createDbRouter } from "./db/dbRouter.js";

import { SseClients } from "./sse/sseClients.js";
import { priceSubscription_fanOut } from "./redis/subscriberFanOut.js";

/* ------ ticker fanout (signup below) ------ */

const redis: RedisClient = createRedisClient();
await redis.connect();

const sseClients = new SseClients();
const { stopPrices } = await priceSubscription_fanOut(redis, sseClients);

/* ------ middleware ------ */

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ------ routes ------ */

app.use("/db", createDbRouter('/history')); // get price history to start the fun
app.use("/sse", createSseRouter('/trades', sseClients)); // SSE does updates

app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

app.use((err: unknown, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

/* ------ http server ------ */
console.log("Starting web-api..");
const port = Number(process.env.PORT ?? 3000);

const server = app.listen(port, () => {
  color.info(`web-api listening on http://localhost:${port}`);
});

/* ------ functions & shutdown ------ */

async function shutdown(signal: string) {
  color.warn(`received ${signal}, shutting down...`);

  server.close();

  // catch and ignore, in case any of these are closing/closed already.
  await stopPrices().catch(() => undefined);
  await redis.quit().catch(() => undefined);

  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));