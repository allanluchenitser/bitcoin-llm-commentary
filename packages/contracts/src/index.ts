export * from "./krakenTypes.js";
export * from "./coinbaseTypes.js";

export type OHLCV = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  interval: number;
};