import type { RedisClient } from "@blc/redis-client";
import { CHANNEL_TICKER_SNAPSHOT, CHANNEL_TICKER_UPDATE, latestKey } from "@blc/contracts";

export type TickerEvent = {
  source: "kraken";
  symbol: string;
  type: "update" | "snapshot";
  ts_ms: number;
  data: Record<string, unknown>;
};

export async function publishTicker(
  event: TickerEvent,
  redis: RedisClient,
) {
  const channel = event.type === "snapshot"
    ? CHANNEL_TICKER_SNAPSHOT
    : CHANNEL_TICKER_UPDATE;

  await redis.publish(channel, JSON.stringify(event));
}

export async function storeLatestSnapshot(
  redis: RedisClient,
  symbol: string,
  snapshot: Record<string, unknown>,
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