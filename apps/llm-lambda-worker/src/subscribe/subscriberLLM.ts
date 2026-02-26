import {
  type KrakenEvent,
  CHANNEL_TICKER_GENERIC,
  OHLCVRow
} from "@blc/contracts";

import type { RedisClient } from "@blc/redis-client";
import { OHLCV } from "@blc/contracts";

export async function subscriberLLM(
  redis: RedisClient,
): Promise<{ stopFanOut: () => Promise<void> }> {

  const sub = redis.duplicate();
  await sub.connect();
  // a redis connect can pub-sub or key-store, not both

  await redis.subscribe(CHANNEL_TICKER_GENERIC, (message: string) => {
    const row = JSON.parse(message) as OHLCVRow;
  });

  return {
    stopFanOut: async (): Promise<void> => {
      try {
        await redis.quit();
      } catch { }
    }
  };
}