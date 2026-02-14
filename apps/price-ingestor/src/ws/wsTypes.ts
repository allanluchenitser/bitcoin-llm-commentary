import WebSocket from 'ws';

export type KrakenSubscriptionRequest = {
  method: "subscribe",
  params: {
    channel: string,
    symbol: string[],

    // "bbo" gets only trades that move prices. "trades" gets everything.
    event_trigger: "bbo" | "trades"
  }
};

export type LoopSocket = WebSocket & { ticks?: number };

