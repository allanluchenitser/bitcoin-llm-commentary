import WebSocket from "ws";

import {
  SubRequest,

  SubAcknowledgement,
  isSubAcknowledgement,

  UpdateResponse,
  isUpdateResponse,

  KrakenMessage
} from "./types-and-guards.js";

/*
  Kraken WebSocket API v2 documentation:
  https://docs.kraken.com/api/docs/guides/global-intro
  https://docs.kraken.com/api/docs/websocket-v2/ticker
*/

/* ------ WebSocket Code Begins ------ */

const URL: string = "wss://ws.kraken.com/v2";
const ws: WebSocket = new WebSocket(URL);

ws.on("open", () => {
  // subscribe to Kraken ticker channel
  const msg: SubRequest = {
    method: "subscribe",
    params: {
      channel: "ticker",
      symbol: ["BTC/USD", "ETH/USD"],
      event_trigger: "bbo"
    }
  };

  ws.send(JSON.stringify(msg));
  console.log("opened websocket to Kraken ticker. send subscription request.");
});

ws.on("message", (kmsg: WebSocket.RawData) => {
  let json: unknown;
  try {
    json = JSON.parse(kmsg.toString());
  }
  catch (e) {
    console.error("Failed to parse message:", kmsg.toString());
    return;
  }

  if (isSubAcknowledgement(json)) {
    const text = `Subscription to ${json.result.channel} for ${json.result.symbol} acknowledged`;
    console.log(text);
    console.log(json);
  }
  else if (isUpdateResponse(json)) {
    const ticker = json.data[0];

    const map = {
      update: "Ticker Update",
      snapshot: "Ticker Snapshot"
    };

    const text = `${map[json.type]} - Symbol: ${ticker.symbol}, Last Price: ${ticker.last}, Bid: ${ticker.bid}, Ask: ${ticker.ask}, Volume: ${ticker.volume}`;
    console.log(text);
    console.log(ticker);
  }
  else {
    console.warn("Received unknown message:", json);
  }
});

ws.on("error", (error: Error) => {
  console.error("WebSocket error:", error);
});

ws.on("close", () => {
  console.log("WebSocket connection closed");
});


