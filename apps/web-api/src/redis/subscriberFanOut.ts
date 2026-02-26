import { CHANNEL_TICKER_GENERIC } from "@blc/contracts";

import type { RedisClient } from "@blc/redis-client";
import type { SseClients } from "@blc/sse-client";

const intervalMs = process.env.KRAKEN_TICKER_INTERVAL_MS
  ? parseInt(process.env.KRAKEN_TICKER_INTERVAL_MS)
  : 1000;

export async function priceSubscription_fanOut(
  redis: RedisClient,
  sseClients: SseClients
): Promise<{ stopPrices: () => Promise<void> }> {

  // one redis connection can pub-sub or key-store, not both
  const sub = redis.duplicate();
  await sub.connect();

  await sub.subscribe(CHANNEL_TICKER_GENERIC, (message: string) => {
    try {
    const json = JSON.parse(message);
      if (json.type === "heartbeat") {
        sseClients.heartbeat();
        return;
      }
      if (json.exchange && json.symbol && json.ts) {
        // looks like an OHLCV tick, fan it out to SSE clients
        sseClients.messageAll(CHANNEL_TICKER_GENERIC, json);
      }
    }
    catch (error) {
      console.error("SSE failed to parse message:", message, error);
    }
  });

  return {
    stopPrices: async (): Promise<void> => {
      try {
        await sub.quit();
      }
      catch { }
    }
  };
}