import type { RedisClient } from "@blc/redis-client";

import {
  CHANNEL_TICKER_SNAPSHOT,
  CHANNEL_TICKER_UPDATE,
  KrakenTickerEvent
} from "@blc/contracts";


export async function publishTicker(
  event: KrakenTickerEvent,
  redis: RedisClient,
) {

  let channel;
  switch(event.type) {
    case "snapshot":
      channel = CHANNEL_TICKER_SNAPSHOT;
      break;
    case "update":
      channel = CHANNEL_TICKER_UPDATE;
      break;
    default:
      throw new Error(`Invalid event type: ${event.type}`);
  }

  await redis.publish(channel, JSON.stringify(event));
}

// strip whitespace
function latestKey(symbol: string) {
  return `ticker:latest:${symbol.replace(/\s+/g, "")}`;
}

export async function storeLatestSnapshot(
  redis: RedisClient,
  symbol: string,
  snapshot: KrakenTickerEvent,
  opts?: { ttlSeconds?: number }
) {
  const key = latestKey(symbol);
  const payload = JSON.stringify(snapshot);

  if (opts?.ttlSeconds) {
    await redis.set(key, payload, { EX: opts.ttlSeconds });
  } else {
    await redis.set(key, payload);
  }
}