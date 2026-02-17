import {
  type KrakenEvent,
  CHANNEL_TICKER_GENERIC
} from "@blc/contracts";

import type { RedisClient } from "@blc/redis-client";
import type { SseClients } from "../sse/sseClients.js";

const intervalMs = process.env.KRAKEN_TICKER_INTERVAL_MS
  ? parseInt(process.env.KRAKEN_TICKER_INTERVAL_MS)
  : 1000;

export async function subRedisFanOutSSE(
  redis: RedisClient,
  sseClients: SseClients
): Promise<{ stopFanOut: () => Promise<void> }> {

  // a redis connect can pub-sub or key-store, not both
  const sub = redis.duplicate();
  await sub.connect();

  let lastTick: KrakenEvent | null = null;

  const fanoutInterval = setInterval(() => {
    if (lastTick) {
      sseClients.messageAll(CHANNEL_TICKER_GENERIC, lastTick);
    }
  }, intervalMs);

  await sub.subscribe(CHANNEL_TICKER_GENERIC, (message: string) => {
    lastTick = JSON.parse(message) as KrakenEvent;
  });

  return {
    stopFanOut: async (): Promise<void> => {
      try {
        await sub.quit();
        clearInterval(fanoutInterval);
      } catch { }
    }
  };
}