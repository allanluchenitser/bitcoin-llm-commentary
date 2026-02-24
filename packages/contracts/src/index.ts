export * from "./krakenTypes.js";
export * from "./coinbaseTypes.js";

export type Instrument = {
  exchange: string;
  symbol: string;
  base_asset?: string;
  quote_asset?: string;
};

export type OHLCV = {
  exchange: string;
  symbol: string;
  ts: string; // start of interval
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

// possibly for reading DB
export type OHLCVRow = {
  exchange: string;
  symbol: string;
  ts: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
};

