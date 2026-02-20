
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

export interface CoinbaseProTickerEvent {
  source: "coinbasepro";
  type: "snapshot" | "update";
  ts_ms: number;
  data: CoinbaseProTickerData[];
}

