import WebSocket from 'ws';

export type KrakenTickerSubscriptionRequest = {
  method: "subscribe",
  params: {
    channel: "ticker",
    symbol: string[],

    // "bbo" gets only trades that move prices. "trades" gets everything.
    event_trigger: "bbo" | "trades"
  }
};

export type KrakenTradeSubscriptionRequest = {
  method: "subscribe",
  params: {
    channel: "trade",
    symbol: string[],
  }
};

export type LoopSocket = WebSocket & { ticks?: number };

