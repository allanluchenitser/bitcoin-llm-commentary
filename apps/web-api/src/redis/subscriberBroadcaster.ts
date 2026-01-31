import type { RedisClient } from "@blc/redis-client";
import { CHANNEL_TICKER_UPDATE, CHANNEL_TICKER_SNAPSHOT } from "@blc/pubsub-contracts";
import type { SseHub } from "../sse/sseHub.js";

export async function subRedisFanOutSSE(redis: RedisClient, hub: SseHub): Promise<() => Promise<void>> {
  const sub = redis.duplicate(); // word on the street is to use a dedicated subscriber client
  await sub.connect();

  await sub.subscribe(CHANNEL_TICKER_UPDATE, (message: string) => {
    try {
      hub.broadcast("ticker:update", JSON.parse(message));
    } catch {
      hub.broadcast("ticker:update", { raw: message });
    }
  });

  await sub.subscribe(CHANNEL_TICKER_SNAPSHOT, (message: string) => {
    try {
      hub.broadcast("ticker:snapshot", JSON.parse(message));
    } catch {
      hub.broadcast("ticker:snapshot", { raw: message });
    }
  });

  return async () => {
    try {
      await sub.quit();
    } catch {
      // ignore
    }
  };
}