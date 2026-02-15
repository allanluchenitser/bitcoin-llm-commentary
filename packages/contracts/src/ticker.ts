export const CHANNEL_TICKER_UPDATE = "ticker:update";
export const CHANNEL_TICKER_SNAPSHOT = "ticker:snapshot";
export const CHANNEL_TICKER_GENERIC = "blc-ticker";

/* ------ Ticker Data Types ------ */

export interface KrakenTickerData {
  source: "kraken";

  // external api so who knows
  ask?: number;
  ask_qty?: number;
  bid?: number;
  bid_qty?: number;
  change?: number;
  change_pct?: number;
  high?: number;
  last?: number;
  low?: number;
  symbol: string;
  timestamp: string;
  volume?: number;
  vwap?: number;
};

export interface CoinbaseProTickerData {
  source: "coinbasepro";
  symbol: string;

  // external api so who knows
  price?: number;
  open_24h?: number;
  volume_24h?: number;
  low_24h?: number;
  high_24h?: number;
  volume_30d?: number;
}

export type TickerData = KrakenTickerData | CoinbaseProTickerData;

/* ------ Ticker Event Types ------ */

export interface KrakenTickerEvent {
  source: "kraken";
  channel: "ticker";
  type: "snapshot" | "update";
  data: KrakenTickerData[];
};

export interface CoinbaseProTickerEvent {
  source: "coinbasepro";
  type: "snapshot" | "update";
  ts_ms: number;
  data: CoinbaseProTickerData[];
}

export type TickerEvent = KrakenTickerEvent | CoinbaseProTickerEvent;