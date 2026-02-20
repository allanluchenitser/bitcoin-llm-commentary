import WebSocket from 'ws';

export type KrakenTickerSubscriptionRequest = {
  method: "subscribe" | "unsubscribe",
  params: {
    channel: "ticker",
    symbol: string[],

    // "bbo" gets only trades that move prices. "trades" gets everything.
    event_trigger: "bbo" | "trades"
  }
};

export type KrakenTradeSubscriptionRequest = {
  method: "subscribe" | "unsubscribe",
  params: {
    channel: "trade",
    symbol: string[],
  }
};

export type CleanUpFunctionParams = {
  socket: WebSocket | null,
  code: number,
  reason: string
}

export type LoopSocket = WebSocket & { ticks?: number };

