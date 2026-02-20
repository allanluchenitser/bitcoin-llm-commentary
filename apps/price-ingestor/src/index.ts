import "@blc/env";
import { WebSocket } from 'ws';
import { createRedisClient, type RedisClient } from "@blc/redis-client";
import {
  CHANNEL_TICKER_GENERIC,
  type OHLCV,
  type KrakenTradeData,
} from "@blc/contracts";
import { connectWs } from "./ws/wsSetup.js";
import { color } from "@blc/color-logger";
import { rawDataToUtf8 } from "./ws/wsHelpers.js";
import {
  type KrakenTradeSubscriptionRequest,
  type CleanUpFunctionParams
} from "./ws/wsTypes.js";

/*
  Kraken WebSocket API v2 documentation:
  https://docs.kraken.com/api/docs/guides/global-intro

  https://docs.kraken.com/api/docs/websocket-v2/ticker
  https://docs.kraken.com/api/docs/websocket-v2/trade
*/

/* ------ OHLCV Buffer ------ */
const tradeBuffer: KrakenTradeData[] = [];
const intervalMs = Number(process.env.INGRESS_BUFFER_INTERVAL_MS) || 60000; // 1-minute interval

function calculateOHLCV(trades: KrakenTradeData[]): OHLCV | null {
  if (trades.length === 0) return null;

  const interval = intervalMs;
  const time = Math.floor(Math.ceil(Date.now() / interval) * interval);

  const open = trades[0].price;
  const close = trades[trades.length - 1].price;
  const high = Math.max(...trades.map((trade) => trade.price));
  const low = Math.min(...trades.map((trade) => trade.price));

  const volume = trades.reduce((sum, trade) => sum + trade.qty, 0);

  return {
    interval,
    time,
    open,
    high,
    low,
    close,
    volume,
  };
}

function processBufferedTrades() {
  console.log(tradeBuffer.length, "trades in buffer, processing...");
  const ohlcv = calculateOHLCV(tradeBuffer);
  if (ohlcv) {
    redis.publish(CHANNEL_TICKER_GENERIC, JSON.stringify(ohlcv));
    console.log("Published OHLCV:", ohlcv);
  }
  tradeBuffer.length = 0; // Clear the buffer
}

setInterval(processBufferedTrades, intervalMs);

// major business function, receives ticket data
function placeTradeData(
  data: WebSocket.RawData,
) {
  const utf8Data = rawDataToUtf8(data);
  const jsonData = JSON.parse(utf8Data);

  console.log(jsonData);

  if (jsonData.channel === "trade" && Array.isArray(jsonData.data)) {
    jsonData.data.forEach((trade: KrakenTradeData) => {
      tradeBuffer.push(trade);
    });
  }
}

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

  await redis.quit();
  console.log('cleanup completed, exiting process');
  process.exit(0);
}

/* ------ Main Execution Flow ------ */

const socketUrl: string = process.env.KRAKEN_WS_URL ?? "wss://ws.kraken.com/v2";

const redis: RedisClient = createRedisClient();
try {
  await redis.connect();
  color.success("[redis] connected");
} catch (err) {
  color.error(`[redis] failed to connect: ${String(err)}`);
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


