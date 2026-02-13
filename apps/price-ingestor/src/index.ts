import "@blc/env";
import { WebSocket } from 'ws';
import { createRedisClient, type RedisClient } from "@blc/redis-client";
import { connectWs } from "./ws/wsSetup.js";
import { color } from "@blc/color-logger";
// import { attachWsBusinessHandlers, type LatestBySymbol } from "./ws/wsBusinessHandlers.js";
import { rawDataToUtf8 } from "./ws/wsHelpers.js";
import { type KrakenSubscriptionRequest } from "./ws/wsTypes.js";

/*
  Kraken WebSocket API v2 documentation:
  https://docs.kraken.com/api/docs/guides/global-intro
  https://docs.kraken.com/api/docs/websocket-v2/ticker
*/

// major business function, receives ticket data
function processPriceData(data: WebSocket.RawData, isBinary: boolean) {
  const utf8Data = rawDataToUtf8(data);
  const jsonData = JSON.parse(utf8Data);
  console.log("tick");
  console.log(jsonData);
}

function sendTickerSubscriptionRequest(socket: WebSocket) {
  const requestMessage: KrakenSubscriptionRequest = {
    method: "subscribe",
    params: {
      channel: "ticker",
      symbol: ["BTC/USD"],
      event_trigger: "bbo"
    }
  };

  socket.send(JSON.stringify(requestMessage))
}

function cleanUpFunction(code: number, reason: string) {
  console.log('cleanup started..')

}

/* ------ Main Execution Flow ------ */

const socketUrl: string = process.env.KRAKEN_WS_URL ?? "wss://ws.kraken.com/v2";
// const latestBySymbol: LatestBySymbol = new Map();

const redis: RedisClient = createRedisClient();
try {
  await redis.connect();
  color.success("[redis] connected");
} catch (err) {
  color.error(`[redis] failed to connect: ${String(err)}`);
  process.exit(1);
}

// const snapshotInterval = setSnapshotPublishingInterval(redis, latestBySymbol);
const socket = await connectWs({
  url: socketUrl,
  messageFunction: processPriceData,
  openFunction: sendTickerSubscriptionRequest,
  fatal: cleanUpFunction,
});

if (socket) {
  console.log('---------- PARENT websocket connected!');
} else {
  console.log('---------- PARENT websocket connection failed');
}



