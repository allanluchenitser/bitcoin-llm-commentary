import { format } from "date-fns";
import { type OHLCV } from "@blc/contracts";

export class CandleBuffer {
  private buf: OHLCV[] = [];

  constructor(private capacity: number) {
    if (capacity <= 0) throw new Error("capacity must be > 0");
  }

  push(c: OHLCV): void {
    this.buf.push(c);
    if (this.buf.length > this.capacity) this.buf.shift();
  }

  pushMany(cs: OHLCV[]): void {
    if (cs.length >= this.capacity) {
      this.buf = cs.slice(-this.capacity);
      return;
    }
    this.buf.push(...cs);
    if (this.buf.length > this.capacity) {
      this.buf = this.buf.slice(-this.capacity);
    }
  }

  last(n: number): OHLCV[] {
    if (n <= 0) return [];
    return this.buf.slice(-Math.min(n, this.buf.length));
  }

  size(): number {
    return this.buf.length;
  }

  clear(): void {
    this.buf.length = 0;
  }

  toArray(): OHLCV[] {
    return this.buf.slice();
  }
}

export function createCandleBuffer(capacity: number) {
  return new CandleBuffer(capacity);
}

export type CandleReport = {
  length: number; // how many candles were there?
  exchange: string;
  symbol: string;
  start: string;
  end: string;
  numCandles: number;
  price: {
    open: number;
    close: number;
    high: number;
    low: number;
    change: number;
    changePct: number;
    range: number;
    rangePct: number;
  };
  volume: {
    total: number;
    average: number;
    max1m: number;
    spikeRatio: number;
  };
  candleCounts: {
    up: number;
    down: number;
    flat: number;
  };
  highlights?: {
    maxVolumeCandle: OHLCV;
    maxRangeCandle: OHLCV;
    maxBodyCandle: OHLCV;
  };
};

export function calculateCandleReport(candles: OHLCV[]): CandleReport {
  if (!candles.length || Array.isArray(candles) === false) {
    throw new Error("No candles provided");
  }

  for (const c of candles) {
    console.log(c.ts, c.high, c.volume);
  }

  const n = candles.length;
  const first = candles[0];
  const last = candles[n - 1];

  let hi = -Infinity;
  let lo = Infinity;
  let volTotal = 0;
  let volMax = -Infinity;

  let up = 0;
  let down = 0;
  let flat = 0;

  for (const c of candles) {
    if (c.high > hi) hi = c.high;
    if (c.low < lo) lo = c.low;
    volTotal += c.volume;
    if (c.volume > volMax) volMax = c.volume;
    if (c.close > c.open) up++;
    else if (c.close < c.open) down++;
    else flat++;
  }

  volTotal = Number(volTotal.toFixed(4));

  const o0 = Number(first.open.toFixed(2));
  const cn = Number(last.close.toFixed(2));
  const chg = Number((cn - o0).toFixed(2));
  const chg_pct = Number(((cn - o0) / o0 * 100).toFixed(2));
  const rangeTotal = Number((hi - lo).toFixed(2));
  const range_pct = Number(((hi - lo) / o0 * 100).toFixed(2));
  const volAvg = Number((volTotal / n).toFixed(4));
  const spike_ratio = Number((volMax / volAvg).toFixed(4));

  // Add human-readable date strings using date-fns
  const startHuman = format(new Date(first.ts), "MMM dd, HH:mm 'UTC'");
  const endHuman = format(new Date(last.ts), "MMM dd, HH:mm 'UTC'");

  return {
    length: n,
    exchange: first.exchange,
    symbol: first.symbol,
    start: startHuman,
    end: endHuman,
    numCandles: n,
    price: {
      open: o0,
      close: cn,
      high: hi,
      low: lo,
      change: chg,
      changePct: chg_pct,
      range: rangeTotal,
      rangePct: range_pct,
    },
    volume: {
      total: volTotal,
      average: volAvg,
      spikeRatio: spike_ratio,
      max1m: volMax,
    },
    candleCounts: {
      up,
      down,
      flat,
    },
    // highlights: undefined as any, // not used, but required by CandleReport type
  };
}