import "@blc/env";

import { color } from "@blc/color-logger";
import { createRedisClient, type RedisClient } from "@blc/redis-client";

import { createApp } from "./http/app.js";
import { SseHub } from "./sse/sseHub.js";
import { subRedisFanOutSSE } from "./redis/subscriber.js";

const port = Number(process.env.PORT ?? 3000);

const redis: RedisClient = createRedisClient();
await redis.connect();

const sseHub = new SseHub();
const stopFanout = await subRedisFanOutSSE(redis, sseHub);

// optional: keep SSE connections alive through proxies
const heartbeatTimer = setInterval(() => sseHub.heartbeat(), 15_000).unref();

const app = createApp({ sseHub });
const server = app.listen(port, () => {
  color.info(`web-api listening on http://localhost:${port}`);
});

async function shutdown(signal: string) {
  color.warn(`received ${signal}, shutting down...`);
  clearInterval(heartbeatTimer);

  server.close(() => {
    // no-op; we'll exit after resources close
  });

  try {
    await stopFanout();
  } catch {
    // ignore
  }

  try {
    await redis.quit();
  } catch {
    // ignore
  }

  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));