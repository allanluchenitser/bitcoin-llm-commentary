import WebSocket from "ws";

/*
  Kraken WebSocket API v2 documentation:
  https://docs.kraken.com/api/docs/websocket-v2/ticker
*/

interface KrakenSubscriptionMessage {
  method: "subscribe";
  params: {
    channel: string;
    symbol: string[];
  };
}

const URL: string = "wss://ws.kraken.com/v2";
const ws: WebSocket = new WebSocket(URL);

ws.on("open", () => {
  // subscribe to Kraken ticker channel
  const msg: KrakenSubscriptionMessage = {
    method: "subscribe",
    params: {
      channel: "ticker",
      symbol: ["BTC/USD", "ETH/USD"]
    }
  };

  ws.send(JSON.stringify(msg));
  console.log("opened + subscribed to Kraken ticker channel");
});


