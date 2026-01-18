import WebSocket from "ws";

/*
  Kraken WebSocket API v2 documentation:
  https://docs.kraken.com/api/docs/guides/global-intro
  https://docs.kraken.com/api/docs/websocket-v2/ticker
*/

interface SubscriptionRequest {
  method: "subscribe";
  params: {
    channel: string;
    symbol: string[];
    eventTrigger?: string;
  };
}

interface SubscriptionAcknowledgement {
  method: "subscribe";
  result: {
    channel: "ticker";
    symbol: string;
  };
}

interface TickerData {
  symbol: string;
  bid: number;
  bid_qty: number;
  ask: number;
  ask_qty: number;
  last: number;
  volume: number;
  vwap: number;
  low: number;
  high: number;
  change: number;
  change_pct: number;
}

interface UpdateResponse {
  channel: "ticker";
  type: "snapshot" | "update";
  data: TickerData[];
}

type KrakenMessage =
  | SubscriptionAcknowledgement
  | UpdateResponse

const URL: string = "wss://ws.kraken.com/v2";
const ws: WebSocket = new WebSocket(URL);

ws.on("open", () => {
  // subscribe to Kraken ticker channel
  const msg: SubscriptionRequest = {
    method: "subscribe",
    params: {
      channel: "ticker",
      symbol: ["BTC/USD", "ETH/USD"],
      eventTrigger: "bbo"
    }
  };

  ws.send(JSON.stringify(msg));
  console.log("opened + subscribed to Kraken ticker channel");
});

ws.on("message", (kmsg: KrakenMessage) => {
  // subscription acknowledgement
  if ("method" in kmsg && kmsg.method === "subscribe") {
    const text = `Subscription to ${kmsg.result.channel} for ${kmsg.result.symbol} acknowledged`
    console.log(text);
  }

  // ticker update
  else if ("channel" in kmsg && kmsg.channel === "ticker" && kmsg.type === "update") {
    const ticker = kmsg.data[0];
    const text = `Ticker Update - Symbol: ${ticker.symbol}, Last Price: ${ticker.last}, Bid: ${ticker.bid}, Ask: ${ticker.ask}, Volume: ${ticker.volume}`;
    console.log(text);
  }
  else {
    console.warn("Received unknown message:", kmsg);
  }
});

ws.on("error", (error: Error) => {
  console.error("WebSocket error:", error);
});

ws.on("close", () => {
  console.log("WebSocket connection closed");
});


