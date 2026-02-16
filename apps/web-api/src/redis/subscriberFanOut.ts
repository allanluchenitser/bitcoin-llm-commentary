import {
  type KrakenTickerEvent,
  CHANNEL_TICKER_GENERIC
} from "@blc/contracts";

import type { RedisClient } from "@blc/redis-client";
import type { SseClients } from "../sse/sseClients.js";




export async function subRedisFanOutSSE(
  redis: RedisClient,
  sseClients: SseClients
): Promise<{ stopFanOut: () => Promise<void> }> {
  const events: KrakenTickerEvent[] = [];

  // a single redis connection can either pub-sub or key-store, not both
  const sub = redis.duplicate();
  await sub.connect();

  await sub.subscribe(CHANNEL_TICKER_GENERIC, (message: string) => {
    // console.log(`from ingress ${CHANNEL_TICKER_GENERIC}: ${message}`);
    try {
      sseClients.messageAll(CHANNEL_TICKER_GENERIC, JSON.parse(message));
    } catch {
      sseClients.messageAll(CHANNEL_TICKER_GENERIC, { raw: message });
    }
  });


  return {
    stopFanOut: async (): Promise<void> => {
      try {
        await sub.quit();
      } catch {
        // ignore
      }
    }
  };
}