import "@blc/env";

import PostgresClient from "@blc/postgres-client";

import { WebSocket } from 'ws';
import { createRedisClient, type RedisClient } from "@blc/redis-client";

import { connectWs } from "./ws/wsSetup.js";
import { rawDataToUtf8 } from "./ws/wsHelpers.js";
import { color } from "@blc/color-logger";

import {
  CHANNEL_TICKER_OHLCV,
  type KrakenTradeData,
} from "@blc/contracts";

import {
  type KrakenTradeSubscriptionRequest,
  type CleanUpFunctionParams
} from "./ws/wsTypes.js";

import { calculateOHLCV } from "./ingestorHelpers.js";

/*
  Kraken WebSocket API v2 documentation:
  https://docs.kraken.com/api/docs/guides/global-intro

  https://docs.kraken.com/api/docs/websocket-v2/ticker
  https://docs.kraken.com/api/docs/websocket-v2/trade
*/

console.log('CHANNEL_TICKER_OHLCV:', CHANNEL_TICKER_OHLCV);

/* ------ OHLCV Buffer ------ */
const tradeBuffer: KrakenTradeData[] = [];
const heartBeats: { channel: "heartbeat" }[] = [];
const intervalMs = Number(process.env.INGRESS_BUFFER_INTERVAL_MS) || 60000; // 1-minute interval

let bufferTimer: NodeJS.Timeout | null = null;
let pgClient: PostgresClient;

// publishes, stores buffer of trades per setInterval
function processBufferedTrades() {

  if (tradeBuffer.length === 0 && heartBeats.length > 0) {
    console.log("No trades. Publishing heartbeat.");
    redis.publish(CHANNEL_TICKER_OHLCV, JSON.stringify({ type: "heartbeat" }));
    return;
  }

  console.log(tradeBuffer.length, "trades in buffer, processing...");
  const ohlcv = calculateOHLCV(tradeBuffer, intervalMs);

  if (ohlcv) {
    try {
      pgClient.insertOHLCV(ohlcv);
    }
    catch (err) {
      console.error("Failed to insert OHLCV into Postgres:", err);
    }

    try {
      redis.publish(CHANNEL_TICKER_OHLCV, JSON.stringify(ohlcv));
    }
    catch (err) {
      console.error("Failed to publish OHLCV to Redis:", err);
    }
  }
  tradeBuffer.length = 0;
  heartBeats.length = 0;
}



// places incoming trades into a buffer
async function placeTradeData(
  data: WebSocket.RawData,
) {
  const utf8Data = rawDataToUtf8(data);
  const jsonData = JSON.parse(utf8Data);

  // grabs what's usually just one trade, but could be multiple if Kraken batches them
  if (jsonData.channel === "trade" && Array.isArray(jsonData.data)) {
    jsonData.data.forEach((trade: unknown) => {
      if (typeof trade !== "object" || trade === null) {
        console.warn("Skipping invalid trade data:", trade);
        return;
      }
      tradeBuffer.push({ ...trade, exchange: "kraken" } as KrakenTradeData);
    });
  }
  else if (jsonData.channel === "heartbeat") {
    heartBeats.push({ channel: "heartbeat" });
  }
}

// initial websockets call to the external exchange
function sendTickerSubscriptionRequest(socket: WebSocket) {
  const requestMessage: KrakenTradeSubscriptionRequest = {
    method: "subscribe",
    params: {
      channel: "trade",
      symbol: ["BTC/USD"],
    }
  };

  socket.send(JSON.stringify(requestMessage))
}

function sendTickerUnsubscriptionRequest(socket: WebSocket) {
  const requestMessage: KrakenTradeSubscriptionRequest = {
    method: "unsubscribe",
    params: {
      channel: "trade",
      symbol: ["BTC/USD"],
    }
  };

  socket.send(JSON.stringify(requestMessage))
}

async function cleanUpFunction({ socket, code, reason }: CleanUpFunctionParams) {
  console.log('cleanup started..')
  console.log(`WebSocket closed with code ${code} and reason: ${reason}`);

  if (socket) {
    sendTickerUnsubscriptionRequest(socket);
  }

  if (bufferTimer) {
    clearInterval(bufferTimer);
    bufferTimer = null;
  }

  await redis.quit();
  console.log('cleanup completed, exiting process');
  process.exit(0);
}

/* ------ Main Execution Flow ------ */

const socketUrl: string = process.env.KRAKEN_WS_URL ?? "wss://ws.kraken.com/v2";

const redis: RedisClient = createRedisClient();
try {
  console.log("[redis] connecting client...");
  await redis.connect();
  color.success("[redis] connected");
} catch (err) {
  color.error(`[redis] failed to connect: ${String(err)}`);
  process.exit(1);
}

const pgConfig = {
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT) || 5432,
  user: process.env.POSTGRES_USER || "blc",
  password: process.env.POSTGRES_PASSWORD || "blc",
  database: process.env.POSTGRES_DB || "blc",
};

try {
  pgClient = new PostgresClient(pgConfig);
} catch (err) {
  color.error(`[postgres] failed to connect: ${String(err)}`);
  process.exit(1);
}

const { getSocket } = await connectWs({
  url: socketUrl,
  messageFunction: placeTradeData,
  openFunction: sendTickerSubscriptionRequest,
  fatal: cleanUpFunction,
});


if (getSocket()) {
  console.log('---------- PARENT websocket connected!');
} else {
  console.log('---------- PARENT websocket connection failed');
  process.exit(1);
}

bufferTimer = setInterval(processBufferedTrades, intervalMs);

process.on('SIGINT', async () => {
  await cleanUpFunction({
    socket: getSocket(),
    code: 0,
    reason: 'SIGINT received'
  });
});

process.on('SIGTERM', async () => {
  await cleanUpFunction({
    socket: getSocket(),
    code: 0,
    reason: 'SIGTERM received'
  });
});


