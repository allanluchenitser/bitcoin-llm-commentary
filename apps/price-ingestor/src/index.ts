import '@blc/env';

import WebSocket from "ws";
import { color } from "@blc/color-logger";

import {
  SubRequest,
  isSubAcknowledgement,
  isUpdateResponse
} from "./types-and-guards.js";

import { createRedisClient, type RedisClient } from "@blc/redis-client";
import { publishUpdate } from "./redis/publisher.js";
import { registerShutdownHandlers } from "./lifecycle/shutdown.js";

import { type TickerLike, type LatestBySymbol } from "./ws/cryptoClient.js";
import { setTickerUpdateInterval, setSnapshotInterval, type FrequencyMetrics } from "./intervals/intervals.js";

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


const latestBySymbol: LatestBySymbol = new Map();

const frequencyMetrics: FrequencyMetrics = {
  updatesPerSec: 0,
  snapshotsPerSec: 0,
  unknownPerSec: 0
};

const tickerUpdateInterval = setTickerUpdateInterval(latestBySymbol, frequencyMetrics);
const snapshotInterval = setSnapshotInterval(redis, latestBySymbol);

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
      frequencyMetrics.snapshotsPerSec += 1;
    }
    else if (json.type === "update") {
      frequencyMetrics.updatesPerSec += 1;
    }
    else {
      frequencyMetrics.unknownPerSec += 1;
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

  frequencyMetrics.unknownPerSec += 1;
});

const { shutdown } = registerShutdownHandlers({
  ws,
  redis,
  stopTimers: () => {
    clearInterval(tickerUpdateInterval);
    clearInterval(snapshotInterval);
  }
});

