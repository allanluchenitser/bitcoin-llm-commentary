import "@blc/env";

import WebSocket from "ws";
import { color } from "@blc/color-logger";

import { createRedisClient, type RedisClient } from "@blc/redis-client";
import { registerShutdownHandlers, type ShutdownDeps } from "./lifecycle/shutdown.js";
import { attachWsBusinessHandlers, type LatestBySymbol } from "./ws/wsBusinessHandlers.js";

import helper from "./ws/wsHelpers.js";

/*
  Kraken WebSocket API v2 documentation:
  https://docs.kraken.com/api/docs/guides/global-intro
  https://docs.kraken.com/api/docs/websocket-v2/ticker
*/

const url: string = process.env.KRAKEN_WS_URL ?? "wss://ws.kraken.com/v2";

let ws: WebSocket | undefined;

let stopping = false;
let reconnectTimer: NodeJS.Timeout | undefined;
let attempt = 0;


const latestBySymbol: LatestBySymbol = new Map();


const redis: RedisClient = createRedisClient();
try {
  await redis.connect();
  color.success("[redis] connected");
} catch (err) {
  color.error(`[redis] failed to connect: ${String(err)}`);
  process.exit(1);
}

// const snapshotInterval = setSnapshotPublishingInterval(redis, latestBySymbol);


function backoffMsFullJitter(attemptNum: number, baseMs = 250, capMs = 30_000): number {
  const maxDelay = Math.min(capMs, baseMs * 2 ** attemptNum);
  return Math.floor(Math.random() * maxDelay);
}

function scheduleReconnect(redis: RedisClient, why: string) {
  if (stopping) return;
  if (reconnectTimer) return;

  const delay = backoffMsFullJitter(attempt++);
  console.error(`[ws][kraken] ${why}; reconnecting in ${delay}ms (attempt=${attempt})`);

  reconnectTimer = setTimeout(() => {
    reconnectTimer = undefined;
    connectWs(redis);
  }, delay);
}

function connectWs(redis: RedisClient) {
  if (stopping) return;

  ws = new WebSocket(url);

  ws.once("open", () => {
    console.log("[ws][kraken] connected");
    attempt = 0;
  });

  // likely an upgrade problem
  ws.once("unexpected-response", (_req, res) => {
    const status = res?.statusCode;
    console.error(`[ws][kraken] unexpected-response HTTP ${status ?? "?"}`);

    // hopeless, don't reconnect
    if ([401, 403, 404, 426].includes(status ?? 0)) {
      shutdown(1);
      return;
    }

    scheduleReconnect(redis, `handshake rejected (HTTP ${status ?? "?"})`);
  });

  ws.once("close", (code, reason) => {
    // console.log(code, reason);
    const reasonText = reason?.length ? reason.toString("utf8") : "";
    scheduleReconnect(redis, `closed code=${code}${reasonText ? ` reason=${reasonText}` : ""}`);
  });

  ws.on("error", (err: Error) => {
      if (helper.isFatalWsError(err)) {
        shutdown(1);
      }
      else {
        console.error(`[ws][kraken] ${String(err)}`);
      }
  });

  // business logic
  attachWsBusinessHandlers({
    ws,
    latestBySymbol,
    frequencyMetrics,
    redis
  });
}

// const tickerUpdateInterval = setTickerMetricsInterval(latestBySymbol, frequencyMetrics);
function shutdown(code = 0) {
  stopping = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);

  try {
    ws?.close();
  } catch {}

  baseShutdown(code);
}

const { shutdown: baseShutdown } = registerShutdownHandlers({
  getWs: () => ws,
  redis,
  stopTimers: () => {
    // clearInterval(tickerUpdateInterval);
    clearInterval(snapshotInterval);
  }
});

connectWs(redis);


