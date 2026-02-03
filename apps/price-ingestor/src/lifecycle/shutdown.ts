import type WebSocket from "ws";
import type { RedisClient } from "@blc/redis-client";

export type ShutdownDeps = {
  ws: WebSocket,
  redis: RedisClient,
  stopTimers: () => void
}

export function registerShutdownHandlers(deps: ShutdownDeps) {
  let shuttingDown = false;
  const { ws, redis, stopTimers } = deps;

  async function shutdown(exitCode = 0): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;

    stopTimers();

    try { ws.close(); } catch {}
    try { await redis.quit(); } catch {}

    process.exit(exitCode);
  }

  process.on("SIGINT", () => void shutdown(0));
  process.on("SIGTERM", () => void shutdown(0));

  return { shutdown };
}