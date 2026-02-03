import "@blc/env";

import { color } from "@blc/color-logger";
import { createRedisClient, type RedisClient } from "@blc/redis-client";

import { createApp } from "./http/app.js";
import { SseHub } from "./sse/sseHub.js";
import { subRedisFanOutSSE } from "./redis/subscriberBroadcaster.js";

const redis: RedisClient = createRedisClient();
await redis.connect();

// SSE sub -> pub fan-out setup
const sseHub = new SseHub();
const stopFanout = await subRedisFanOutSSE(redis, sseHub);
const heartbeatTimer = setInterval(() => sseHub.heartbeat(), 15_000).unref();

// Where the user actually signs up for SSE (/sse/ticker)
const port = Number(process.env.PORT ?? 3000);
const app = createApp({ sseHub });
const server = app.listen(port, () => {
  color.info(`web-api listening on http://localhost:${port}`);
});

// Cleanup on shutdown
async function shutdown(signal: string) {
  color.warn(`received ${signal}, shutting down...`);
  clearInterval(heartbeatTimer);

  server.close();

  await stopFanout().catch(() => undefined);
  await redis.quit().catch(() => undefined);

  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));