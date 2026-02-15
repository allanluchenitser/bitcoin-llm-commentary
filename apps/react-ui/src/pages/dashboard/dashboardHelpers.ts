import { type UTCTimestamp } from 'lightweight-charts';

export function toUTCTimestamp(ts: unknown): UTCTimestamp {
  const n = typeof ts === "number" ? ts : typeof ts === "string" ? Number(ts) : NaN;

  // If it's ms (13 digits-ish), convert to seconds; if it's already seconds (10 digits), keep it.
  const seconds = n > 1e12 ? Math.floor(n / 1000) : Math.floor(n);

  return seconds as UTCTimestamp;
}

export function toFiniteNumber(x: unknown): number | null {
  const n = typeof x === "number" ? x : typeof x === "string" ? Number(x) : NaN;
  return Number.isFinite(n) ? n : null;
}