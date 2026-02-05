export const CHANNEL_TICKER_UPDATE = "ticker:update";
export const CHANNEL_TICKER_SNAPSHOT = "ticker:snapshot";

// strip whitespace
export function latestKey(symbol: string) {
  return `ticker:latest:${symbol.replace(/\s+/g, "")}`;
}

export type TickerSseEvent = {
  source: string;
  symbol: string;
  type: "update" | "snapshot" | string;
  ts_ms: number;
  data: Record<string, unknown>;
};

export type KrakenTickerLike = {
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
  volume?: number;
  vwap?: number;
};

