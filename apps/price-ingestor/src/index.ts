import '@blc/env';

import WebSocket from "ws";
import { color } from "@blc/color-logger";

import { createRedisClient, type RedisClient } from "@blc/redis-client";
import { registerShutdownHandlers } from "./lifecycle/shutdown.js";

import { attachCryptoWebSocketHandlers } from './ws/attachCryptoWebSocketHandlers.js';

import { type LatestBySymbol } from "./ws/attachCryptoWebSocketHandlers.js";
import { setTickerUpdateInterval, setSnapshotInterval, type FrequencyMetrics } from "./intervals/intervals.js";

/*
  Kraken WebSocket API v2 documentation:
  https://docs.kraken.com/api/docs/guides/global-intro
  https://docs.kraken.com/api/docs/websocket-v2/ticker
*/

const url: string = process.env.KRAKEN_WS_URL ?? "wss://ws.kraken.com/v2";
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

const { shutdown } = registerShutdownHandlers({
  ws,
  redis,
  stopTimers: () => {
    clearInterval(tickerUpdateInterval);
    clearInterval(snapshotInterval);
  }
});

attachCryptoWebSocketHandlers({
  ws,
  fatal: (err: Error) => {
    color.error(`[ws][kraken] ${String(err)}`);
    shutdown(1);
  },
  latestBySymbol,
  frequencyMetrics,
  redis
});




