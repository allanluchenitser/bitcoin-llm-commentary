import type { RedisClient } from "@blc/redis-client";
import { CHANNEL_TICKER_UPDATE, CHANNEL_TICKER_SNAPSHOT } from "@blc/pubsub-contracts";
import type { SseHub } from "../sse/sseHub.js";

export async function subRedisFanOutSSE(redis: RedisClient, hub: SseHub): Promise<() => Promise<void>> {
  const sub = redis.duplicate(); // word on the street is to use a dedicated subscriber client
  await sub.connect();

  await sub.subscribe(CHANNEL_TICKER_UPDATE, (message: string) => {
    // console.log(`from ingress ${CHANNEL_TICKER_UPDATE}: ${message}`);
    try {
      hub.broadcast(CHANNEL_TICKER_UPDATE, JSON.parse(message));
    } catch {
      hub.broadcast(CHANNEL_TICKER_UPDATE, { raw: message });
    }
  });

  await sub.subscribe(CHANNEL_TICKER_SNAPSHOT, (message: string) => {
    // console.log(`from ingress ${CHANNEL_TICKER_SNAPSHOT}: ${message}`);
    try {
      hub.broadcast(CHANNEL_TICKER_SNAPSHOT, JSON.parse(message));
    } catch {
      hub.broadcast(CHANNEL_TICKER_SNAPSHOT, { raw: message });
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