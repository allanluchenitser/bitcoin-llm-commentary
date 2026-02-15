import { type UTCTimestamp, type CandlestickData } from 'lightweight-charts';

export function toUTCTimestamp(ts: unknown): UTCTimestamp {
  /* yes, AI did this */
  let n: number;

  if (typeof ts === "string" && ts.includes("T")) {
    // Parse ISO 8601 string to a Date object and get the timestamp in seconds
    n = Math.floor(new Date(ts).getTime() / 1000);
  } else if (typeof ts === "number") {
    n = ts;
  } else if (typeof ts === "string") {
    n = Number(ts);
  } else {
    n = NaN;
  }

  // If it's ms (13 digits-ish), convert to seconds; if it's already seconds (10 digits), keep it.
  const seconds = n > 1e12 ? Math.floor(n / 1000) : Math.floor(n);

  return seconds as UTCTimestamp;
}

export function toFiniteNumber(x: unknown): number | null {
  const n = typeof x === "number" ? x : typeof x === "string" ? Number(x) : NaN;
  return Number.isFinite(n) ? n : null;
}

export const fakeCandlestickData: CandlestickData[] = [
  { time: toUTCTimestamp("2026-01-01"), open: 41800, high: 42550, low: 41550, close: 42150 },
  { time: toUTCTimestamp("2026-01-02"), open: 42150, high: 43000, low: 42000, close: 42800 },
  { time: toUTCTimestamp("2026-01-03"), open: 42800, high: 42950, low: 42100, close: 42425 },
  { time: toUTCTimestamp("2026-01-04"), open: 42425, high: 43400, low: 42350, close: 43110 },
  { time: toUTCTimestamp("2026-01-05"), open: 43110, high: 44300, low: 42950, close: 43990 },
  { time: toUTCTimestamp("2026-01-06"), open: 43990, high: 44120, low: 43200, close: 43550 },
  { time: toUTCTimestamp("2026-01-07"), open: 43550, high: 44850, low: 43400, close: 44620 },
  { time: toUTCTimestamp("2026-01-08"), open: 44620, high: 44700, low: 43850, close: 44180 },
  { time: toUTCTimestamp("2026-01-09"), open: 44180, high: 45550, low: 44100, close: 45210 },
  { time: toUTCTimestamp("2026-01-10"), open: 45210, high: 45950, low: 45000, close: 45740 },
];