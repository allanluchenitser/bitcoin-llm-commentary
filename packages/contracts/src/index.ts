export * from "./krakenTypes.js";
export * from "./coinbaseTypes.js";

export const CHANNEL_TICKER_OHLCV = "blc-ticker";

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

export type LLMCommentary = {
  exchange: string;
  symbol: string;
  ts: string;
  commentary: string;
  summaryType: string;
  llmUsed: string;
}

export function ohclvRows2Numbers(rows: OHLCVRow[]): OHLCV[] {
  return rows.map(row => ({
    ts: row.ts,
    exchange: row.exchange,
    symbol: row.symbol,
    open: Number(row.open),
    close: Number(row.close),
    high: Number(row.high),
    low: Number(row.low),
    volume: Number(row.volume),
  }));
}
export function ohlcvRow2Num(row: OHLCVRow): OHLCV {
  return ({
    ts: row.ts,
    exchange: row.exchange,
    symbol: row.symbol,
    open: Number(row.open),
    close: Number(row.close),
    high: Number(row.high),
    low: Number(row.low),
    volume: Number(row.volume),
  });
}
