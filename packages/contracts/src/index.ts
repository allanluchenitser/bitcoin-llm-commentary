export * from "./krakenTypes.js";
export * from "./coinbaseTypes.js";

export type Instrument = {
  instrumentId: number;
  exchange: string;
  symbol: string;
};

// for general, UI
export type OHLCV = {
  ohlcvId?: number;
  instrumentId: number;
  instrument?: string;

  intervalSeconds: number;
  time: number;

  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

// for DB
export type OHLCVRow = {
  ohlcvId: number;
  instrumentId: number;

  intervalSeconds: number;
  timestamp: string;

  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
};

