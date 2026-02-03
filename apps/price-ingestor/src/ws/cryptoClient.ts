export type TickerLike = {
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

export type LatestBySymbol = Map<
  string,
  { ticker: TickerLike; lastType: "snapshot" | "update" }
>;