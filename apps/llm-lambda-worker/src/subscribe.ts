import {
  CHANNEL_TICKER_GENERIC,
  ohclvRows2Numbers,
  type OHLCVRow,
  type OHLCV
} from "@blc/contracts";

import type { RedisClient } from "@blc/redis-client";
import { pgClient } from "./initDb.js";
import { OpenAI } from "openai";

const buffer: OHLCV[] = [];

type SubscriberParameters = {
  redis: RedisClient;
  openai: () => OpenAI;
}

export async function subscriberLLM({ redis, openai }: SubscriberParameters):
  Promise<{ stopFanOut: () => Promise<void> }> {

  const sub = redis.duplicate();
  await sub.connect();
  // a redis connect can pub-sub or key-store, not both

  await redis.subscribe(CHANNEL_TICKER_GENERIC, (message: string) => {
    const ohlcv = ohclvRows2Numbers([JSON.parse(message) as OHLCVRow])[0] as OHLCV;
    buffer.push(ohlcv);

    console.log(`Buffer length: ${buffer.length}`);
    console.log(`Latest OHLCV: ${JSON.stringify(ohlcv)}`);

    if (buffer.length >= 10) {


      pgClient.insertLLMCommentary({
        exchange: ohlcv.exchange,
        symbol: ohlcv.symbol,
        ts: ohlcv.ts,
        commentary: `Latest 10 OHLCV ticks for ${ohlcv.symbol} on ${ohlcv.exchange}: ${JSON.stringify(buffer)}`,
        summaryType: "commentary",
        llmUsed: "gpt-4"
      }).catch(err => {
        console.error("Error inserting LLM commentary:", err);
      });
      buffer.length = 0; // Clear the buffer after processing
    }
  });

  return {
    stopFanOut: async (): Promise<void> => {
      try {
        await redis.quit();
      } catch { }
    }
  };
}