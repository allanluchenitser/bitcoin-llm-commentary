import WebSocket from "ws";

import {
  SubRequest,
  isSubAcknowledgement,
  isUpdateResponse
} from "./types-and-guards.js";

import { color } from "@blc/color-logger";
/*
  Kraken WebSocket API v2 documentation:
  https://docs.kraken.com/api/docs/guides/global-intro
  https://docs.kraken.com/api/docs/websocket-v2/ticker
*/

/* ------ WebSocket Code Begins ------ */

const URL: string = "wss://ws.kraken.com/v2";
const ws: WebSocket = new WebSocket(URL);

// Track latest ticker per symbol + last message type for that symbol
type TickerLike = {
  symbol: string;
  bid?: number;
  ask?: number;
  last?: number;
  volume?: number;
  timestamp?: string;
};

const latestBySymbol = new Map<string, { ticker: TickerLike; lastType: "snapshot" | "update" }>();

/* ------ print per-second to prevent console overload ------ */

let updatesPerSec = 0;
let snapshotsPerSec = 0;
let unknownPerSec = 0;

setInterval(() => {
  const parts: string[] = [];
  for (const [symbol, v] of latestBySymbol.entries()) {
    const t = v.ticker;
    parts.push(
      `${symbol} (${v.lastType}) \
      last=${t.last ?? "?"} \
      bid=${t.bid ?? "?"} \
      ask=${t.ask ?? "?"} \
      vol=${t.volume ?? "?"}`
    );
  }

  color.info(
    `[ticker] update=${updatesPerSec}/s \
    snapshot=${snapshotsPerSec}/s \
    unknown=${unknownPerSec}/s`
  )

  if (parts.length > 0) {
    console.log(parts.join('\n') + '\n');
  }

  updatesPerSec = 0;
  snapshotsPerSec = 0;
  unknownPerSec = 0;
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

ws.on("message", (kmsg: WebSocket.RawData) => {
  let json: unknown;
  try {
    json = JSON.parse(kmsg.toString());
  } catch {
    console.error("Failed to parse message:", kmsg.toString());
    return;
  }

  if (isSubAcknowledgement(json)) {
    color.warn(
      `Subscription to ${json.result.channel} for \
      ${Array.isArray(json.result.symbol) ? json.result.symbol.join(", ") : json.result.symbol} \
      acknowledged`
    );
    return;
  }

  if (isUpdateResponse(json)) {
    const ticker = json.data[0] as TickerLike;

    if (json.type === "snapshot") snapshotsPerSec += 1;
    else if (json.type === "update") updatesPerSec += 1;
    else unknownPerSec += 1;

    latestBySymbol.set(
      ticker.symbol,
      { ticker, lastType: json.type }
    );

    return;
  }

  unknownPerSec += 1;
});

ws.on("error", (error: Error) => {
  console.error("WebSocket error:", error);
});

ws.on("close", () => {
  console.log("WebSocket connection closed");
});


