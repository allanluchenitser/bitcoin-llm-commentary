export * from "./krakenTypes.js";
export * from "./coinbaseTypes.js";

export type Instrument = {
  instrumentId: number;
  exchange: string;
  symbol: string;
};

export type OHLCV = {
  ohlcvId?: number;
  instrumentId: number;
  instrument?: string;

  timeSize: number; // size of interval in seconds
  time: number; // which second is this

  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

// possibly for reading DB
export type OHLCVRow = {
  ohlcvId: number;
  instrumentId: number;

  timeSize: number;
  time: string;

  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
};

