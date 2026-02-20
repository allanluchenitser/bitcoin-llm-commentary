import "@blc/env";
import { WebSocket } from 'ws';
import { createRedisClient, type RedisClient } from "@blc/redis-client";
import { CHANNEL_TICKER_GENERIC } from "@blc/contracts";
import { connectWs } from "./ws/wsSetup.js";
import { color } from "@blc/color-logger";
import { rawDataToUtf8 } from "./ws/wsHelpers.js";
import { type KrakenTradeSubscriptionRequest, type LoopSocket } from "./ws/wsTypes.js";

/*
  Kraken WebSocket API v2 documentation:
  https://docs.kraken.com/api/docs/guides/global-intro

  https://docs.kraken.com/api/docs/websocket-v2/ticker
  https://docs.kraken.com/api/docs/websocket-v2/trade
*/

// major business function, receives ticket data
function processPriceData(
  data: WebSocket.RawData,
) {
  const utf8Data = rawDataToUtf8(data);
  const jsonData = JSON.parse(utf8Data);
  redis.publish(CHANNEL_TICKER_GENERIC, JSON.stringify(jsonData));
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

async function cleanUpFunction(code: number, reason: string) {
  console.log('cleanup started..')
  console.log(`WebSocket closed with code ${code} and reason: ${reason}`);

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
  messageFunction: processPriceData,
  openFunction: sendTickerSubscriptionRequest,
  fatal: cleanUpFunction,
});

if (getSocket()) {
  console.log('---------- PARENT websocket connected!');
} else {
  console.log('---------- PARENT websocket connection failed');
  process.exit(1);
}



