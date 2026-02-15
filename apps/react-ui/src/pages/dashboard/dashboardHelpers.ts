import { type UTCTimestamp } from 'lightweight-charts';

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