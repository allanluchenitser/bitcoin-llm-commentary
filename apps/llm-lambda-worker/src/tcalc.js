#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { encoding_for_model } from "tiktoken";

const fileArg = process.argv[2] || "tcalc.json";
const modelArg = process.argv[3] || process.env.LLM_MODEL_NAME || "gpt-5-nano";
const typeArg = process.argv[4] || "regular";

let candles;
try {
  const raw = fs.readFileSync(path.resolve(fileArg), 'utf8');
  candles = JSON.parse(raw);
  if (!Array.isArray(candles)) throw new Error('Input JSON must be an array');
} catch (err) {
  console.error('Error reading or parsing JSON:', err.message);
  process.exit(1);
}

const enc = encoding_for_model(modelArg);
const REGULAR_INTERVAL_CANDLES = 30; // You can adjust or make this an argument

function scrapPromptBuilder(type, candles) {
  if (candles.length > REGULAR_INTERVAL_CANDLES) {
    console.warn(`Number of candles (${candles.length}) exceeds the regular interval limit (${REGULAR_INTERVAL_CANDLES}). Consider reducing the number of candles or summarizing the data before sending to LLM.`);
    throw new Error("Too many candles for LLM input.");
  }

  const aggregated = aggregateOHLCV(candles);
  const jsonData = JSON.stringify(aggregated, null, 2);

  return `
Developer:
Summarize BTC/USD price action using only provided metrics.
3–5 sentences. No predictions. No invented numbers.

User:
Key:
o0=first open, cn=last close, hi=max high, lo=min low
chg=cn-o0, chg_pct=percent change
range=hi-lo, range_pct=percent range
vol.total=sum volume, vol.avg=avg 1m volume
vol.max_1m=max 1m volume, spike_ratio=max_1m/avg
up/down/flat=count of candle directions

Rules:
- State net direction (chg, chg_pct).
- Mention hi/lo range.
- Comment on volume; if spike_ratio>=2 say "spike", if >=1.3 say "elevated", else "steady".
- Be concise.

Data:
${jsonData}  `;
}

let prompt;
try {
  prompt = scrapPromptBuilder(typeArg, candles);
} catch (err) {
  console.error('Error building prompt:', err.message);
  process.exit(1);
}

const tokens = enc.encode(prompt);
console.log(`Model: ${modelArg}`);
console.log(`Candles: ${candles.length}`);
console.log(`Prompt token count: ${tokens.length}`);

function aggregateOHLCV(candles) {
  if (!candles.length) {
    throw new Error("No candles provided");
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

  let maxVolCandle = first;
  let maxRangeCandle = first;
  let maxBodyCandle = first;

  let maxRange = -Infinity;
  let maxBody = -Infinity;

  for (const c of candles) {
    // High / Low
    if (c.h > hi) hi = c.h;
    if (c.l < lo) lo = c.l;

    // Volume
    volTotal += c.v;
    if (c.v > volMax) {
      volMax = c.v;
      maxVolCandle = c;
    }

    // Direction
    if (c.c > c.o) up++;
    else if (c.c < c.o) down++;
    else flat++;

    // Range
    const range = c.h - c.l;
    if (range > maxRange) {
      maxRange = range;
      maxRangeCandle = c;
    }

    // Body
    const body = Math.abs(c.c - c.o);
    if (body > maxBody) {
      maxBody = body;
      maxBodyCandle = c;
    }
  }

  const o0 = first.o;
  const cn = last.c;

  const chg = cn - o0;
  const chg_pct = (chg / o0) * 100;

  const rangeTotal = hi - lo;
  const range_pct = (rangeTotal / o0) * 100;

  const volAvg = volTotal / n;
  const spike_ratio = volMax / volAvg;

  return {
    e: first.e,
    s: first.s,
    start: first.t,
    end: last.t,
    n,
    px: {
      o0,
      cn,
      hi,
      lo,
      chg,
      chg_pct,
      range: rangeTotal,
      range_pct,
    },
    vol: {
      total: volTotal,
      avg: volAvg,
      max_1m: volMax,
      spike_ratio,
    },
    candles: {
      up,
      down,
      flat,
    },
    highlights: {
      max_vol_candle: maxVolCandle,
      max_range_candle: maxRangeCandle,
      max_body_candle: maxBodyCandle,
    },
  };
}