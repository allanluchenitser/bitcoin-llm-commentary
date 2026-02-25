import {
  type KrakenEvent,
  CHANNEL_TICKER_GENERIC
} from "@blc/contracts";

import type { RedisClient } from "@blc/redis-client";


export async function subscriberLLM(redis: RedisClient): Promise<{ stopFanOut: () => Promise<void> }> {

  const sub = redis.duplicate();
  await sub.connect();
  // a redis connect can pub-sub or key-store, not both
  let lastTick: KrakenEvent | null = null;

  await redis.subscribe(CHANNEL_TICKER_GENERIC, (message: string) => {
    lastTick = JSON.parse(message) as KrakenEvent;
  });

  return {
    stopFanOut: async (): Promise<void> => {
      try {
        await redis.quit();
      } catch { }
    }
  };
}