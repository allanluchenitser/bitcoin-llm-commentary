import { createRedisClient, type RedisClient } from "@blc/redis-client";

import {
  CHANNEL_TICKER_OHLCV,
  ohlcvRow2Num,
  type OHLCVRow
} from "@blc/contracts";

import { CandleBuffer } from "./llm_help.js";

let redis: RedisClient | null = null;

export default async function setupRedis(candleBuffer: CandleBuffer): Promise<() => void>   {
  const client = createRedisClient();
  await client.connect();

  const handler = (message: string) => {
    const row = JSON.parse(message) as OHLCVRow;
    const data = ohlcvRow2Num(row);
    candleBuffer.push(data);
  }

  await client.subscribe(CHANNEL_TICKER_OHLCV, handler);

  let closed = false;
  return async () => {
    if (closed) return;
    closed = true;
    try {
      await client.unsubscribe(CHANNEL_TICKER_OHLCV, handler);
    } catch (err) {
      console.warn('Error unsubscribing from Redis channel:', err);
    }
    try {
      // seems a bit defensive but OK
      if (typeof client.disconnect === 'function') {
        await (client as any).disconnect();
      } else if (typeof (client as any).quit === 'function') {
        await (client as any).quit();
      }
    } catch (err) {
      console.error('Error closing Redis client:', err);
    }
  };
}