import '@blc/env';

import WebSocket from "ws";
import { color } from "@blc/color-logger";

import {
  SubRequest,
  isSubAcknowledgement,
  isUpdateResponse
} from "./types-and-guards.js";

import { createRedisClient, type RedisClient } from "@blc/redis-client";
import { publishSnapshot, publishUpdate, storeLatestSnapshot } from "./redis/publisher.js";

/*
  Kraken WebSocket API v2 documentation:
  https://docs.kraken.com/api/docs/guides/global-intro
  https://docs.kraken.com/api/docs/websocket-v2/ticker
*/

const url: string = "wss://ws.kraken.com/v2";
const ws: WebSocket = new WebSocket(url);

const redis: RedisClient = createRedisClient();
try {
  await redis.connect();
  color.success("[redis] connected");
} catch (err) {
  color.error(`[redis] failed to connect: ${String(err)}`);
  process.exit(1);
}

type TickerLike = {
  ask?: number;
  ask_qty?: number;
  bid?: number;
  bid_qty?: number;
  change?: number;
  change_pct?: number;
  high?: number;
  last?: number;
  low?: number;
  symbol: string;
  volume?: number;
  vwap?: number;
};

const latestBySymbol = new Map<
  string,
  { ticker: TickerLike; lastType: "snapshot" | "update" }
>();

let updatesPerSec = 0;
let snapshotsPerSec = 0;
let unknownPerSec = 0;

let snapshotFlushInFlight = false;

// Your existing per-second console summarizer stays as-is
setInterval(() => {
  const parts: string[] = [];
  for (const [symbol, v] of latestBySymbol.entries()) {
    const t = v.ticker;
    parts.push(
      `${symbol} (${v.lastType}) last=${t.last ?? "?"} bid=${t.bid ?? "?"} ask=${t.ask ?? "?"}`
    );
  }

  color.info(
    `[ticker] update=${updatesPerSec}/s snapshot=${snapshotsPerSec}/s unknown=${unknownPerSec}/s`
  );

  if (parts.length > 0) console.log(parts.join("\n") + "\n");

  updatesPerSec = 0;
  snapshotsPerSec = 0;
  unknownPerSec = 0;
}, 1000);

// Coalesce snapshots to Redis once per second (store + publish)
setInterval(async () => {
  if (snapshotFlushInFlight) return;
  snapshotFlushInFlight = true;

  try {
    const ts = Date.now();

    for (const [symbol, v] of latestBySymbol.entries()) {
      const snapshotEvent = {
        source: "kraken" as const,
        symbol,
        type: "snapshot" as const,
        ts_ms: ts,
        data: v.ticker as unknown as Record<string, unknown>
      };

      try {
        await storeLatestSnapshot(redis, symbol, snapshotEvent, { ttlSeconds: 120 });
        await publishSnapshot(redis, snapshotEvent);
      } catch (err) {
        color.error(`[redis] snapshot store/publish failed for ${symbol}: ${String(err)}`);
      }
    }
  } finally {
    snapshotFlushInFlight = false;
  }
}, 1000);

ws.on("open", () => {
  const msg: SubRequest = {
    method: "subscribe",
    params: {
      channel: "ticker",
      symbol: ["BTC/USD", "ETH/USD"],
      event_trigger: "bbo"
    }
  };

  ws.send(JSON.stringify(msg));
  console.log("Opened websocket to Kraken ticker. Subscription request sent.");
});

ws.on("message", async (kmsg: WebSocket.RawData) => {
  let json: unknown;
  try {
    json = JSON.parse(kmsg.toString());
  } catch {
    console.error("Failed to parse message:", kmsg.toString());
    return;
  }

  if (isSubAcknowledgement(json)) return;

  if (isUpdateResponse(json)) {
    const ticker = json.data[0] as TickerLike;

    if (json.type === "snapshot") {
      snapshotsPerSec += 1;
    }
    else if (json.type === "update") {
      updatesPerSec += 1;
    }
    else {
      unknownPerSec += 1;
    }

    latestBySymbol.set(ticker.symbol, { ticker, lastType: json.type });

    // publish every update event
    const updateEvent = {
      source: "kraken" as const,
      symbol: ticker.symbol,
      type: "update" as const,
      ts_ms: Date.now(),
      data: ticker as unknown as Record<string, unknown>
    };

    try {
      await publishUpdate(redis, updateEvent);
    } catch (err) {
      color.error(`[redis] update publish failed for ${ticker.symbol}: ${String(err)}`);
    }

    return;
  }

  unknownPerSec += 1;
});

async function shutdown() {
  try {
    ws.close();
  } catch {
    // ignore
  }
  try {
    await redis.quit();
  } catch {
    // ignore
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);


