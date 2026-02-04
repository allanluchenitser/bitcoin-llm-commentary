import "@blc/env";
import express from "express";

import { color } from "@blc/color-logger";
import { createRedisClient, type RedisClient } from "@blc/redis-client";
import { createSseRouter } from "./sse/sseRouter.js";
import { SseHub } from "./sse/sseHub.js";
import { subRedisFanOutSSE } from "./redis/subscriberBroadcaster.js";

const redis: RedisClient = createRedisClient();
await redis.connect();

// SSE sub -> pub fan-out setup
const sseHub = new SseHub();
const stopFanout = await subRedisFanOutSSE(redis, sseHub);
const heartbeatTimer = setInterval(() => sseHub.heartbeat(), 15_000).unref();

const port = Number(process.env.PORT ?? 3000);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => res.status(200).json({ ok: true }));
app.use("/sse", createSseRouter('/ticker', sseHub));

app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

// error handler
app.use((err: unknown, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

const server = app.listen(port, () => {
  color.info(`web-api listening on http://localhost:${port}`);
});

async function shutdown(signal: string) {
  color.warn(`received ${signal}, shutting down...`);
  clearInterval(heartbeatTimer);

  server.close();

  // catch and ignore, in case any of these are closing/closed already.
  await stopFanout().catch(() => undefined);
  await redis.quit().catch(() => undefined);

  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));