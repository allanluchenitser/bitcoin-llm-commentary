import type { RedisClientType } from "redis";
import { TOPIC_TICKER_SNAPSHOT, TOPIC_TICKER_UPDATE, latestKey } from "./topics.js";

export type TickerEvent = {
  source: "kraken";
  symbol: string;
  type: "update" | "snapshot";
  ts_ms: number;
  data: Record<string, unknown>;
};

export async function publishUpdate(redis: RedisClientType, event: TickerEvent) {
  await redis.publish(TOPIC_TICKER_UPDATE, JSON.stringify(event));
}

export async function publishSnapshot(redis: RedisClientType, event: TickerEvent) {
  await redis.publish(TOPIC_TICKER_SNAPSHOT, JSON.stringify(event));
}

export async function storeLatestSnapshot(
  redis: RedisClientType,
  symbol: string,
  snapshot: Record<string, unknown>,
  opts?: { ttlSeconds?: number }
) {
  const key = latestKey(symbol);
  const payload = JSON.stringify(snapshot);

  if (opts?.ttlSeconds) {
    await redis.setEx(key, opts.ttlSeconds, payload);
  } else {
    await redis.set(key, payload);
  }
}