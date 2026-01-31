import type { RedisClient } from "@blc/redis-client";
import { CHANNEL_TICKER_UPDATE, CHANNEL_TICKER_SNAPSHOT } from "@blc/pubsub-contracts";
import type { SseHub } from "../sse/hub.js";

export async function startRedisToSseFanout(redis: RedisClient, hub: SseHub) {
  // redis v4 best practice: use a dedicated connection for pub/sub
  const sub = redis.duplicate();
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