import {
  type UTCTimestamp,
  type CandlestickData
} from 'lightweight-charts';

import pRetry from 'p-retry';

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

export const fakePriceComment = () => {
  const comments = [
    "Bitcoin is showing strong bullish momentum, with a significant increase in trading volume.",
    "Bitcoin's price has been on a remarkable run, reaching new heights and attracting significant attention from both retail and institutional investors. The surge in price can be attributed to a combination of factors, including increased adoption by major companies, favorable regulatory developments, and a growing recognition of Bitcoin as a store of value. Technical analysis reveals that the current uptrend is robust, with key indicators such as the MACD and RSI showing strong bullish signals. However, it's important for traders to exercise caution, as the rapid price increase has also led to heightened volatility. Setting appropriate stop-loss levels and closely monitoring market conditions can help manage risk in this dynamic environment.",
    "The price has broken through a key resistance level, indicating potential for further gains.",
    "Technical indicators are signaling overbought conditions, suggesting a possible short-term pullback.",
    "Market sentiment is positive, with many traders expressing optimism about Bitcoin's future performance.",
    "The recent price action of Bitcoin has been characterized by a steady upward trajectory, with the asset breaking through several key resistance levels. This bullish momentum can be attributed to a variety of factors, including increased institutional adoption, favorable regulatory news, and a general shift in market sentiment towards cryptocurrencies. Technical indicators are currently showing strong bullish signals, with the MACD indicating positive momentum and the RSI approaching overbought territory. While the outlook remains positive, traders should remain vigilant for signs of a potential pullback, especially given the heightened volatility that often accompanies rapid price increases.",
    "Recent news about institutional adoption has contributed to the upward price movement.",
    "The Relative Strength Index (RSI) is approaching 70, which may indicate that the asset is becoming overvalued.",
    "Support levels have been holding well, providing a solid foundation for the current uptrend.",
    "There is increased volatility in the market, which could lead to rapid price fluctuations in the near term.",
    "Bitcoin has experienced a significant price surge over the past week, breaking through multiple resistance levels and reaching new all-time highs. The surge has been driven by a combination of factors, including increased institutional interest, positive regulatory developments, and growing mainstream adoption. Technical analysis indicates that the current uptrend is strong, with key indicators such as the Moving Average Convergence Divergence (MACD) and the Relative Strength Index (RSI) showing bullish signals. However, traders should be mindful of potential volatility and consider setting stop-loss orders to manage risk in case of a sudden market correction.",
    "Analysts are closely watching for any signs of a reversal, as the current trend has been quite strong.",
    "Overall, Bitcoin's price action suggests a bullish outlook, but traders should remain cautious of potential corrections."
  ];


  return comments[Math.floor(Math.random() * comments.length)];
}

export function formatUtcMonthDayTime(utcIso: string, locale = "en-US") {
  const d = new Date(utcIso);

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    second: "numeric",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",  // interpret/format as UTC
  }).format(d);
}

const INITIAL_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 60_000;

const isAbortError = (error: unknown) => {
  return error instanceof DOMException && error.name === 'AbortError';
};

export function startRetriedFetch<T>(opts: {
  fetcher: (signal: AbortSignal) => Promise<T>;
  onSuccess: (data: T) => void;
  onFailure: (error: unknown) => void;
}) {
  let cancelled = false;
  let loaded = false;
  let activeController: AbortController | null = null;
  let runToken = 0;

  const run = (restart = false) => {
    if (cancelled || loaded) return;
    if (activeController && !restart) return;

    if (restart) {
      runToken += 1;
      activeController?.abort();
    }

    const token = runToken;
    const controller = new AbortController();
    activeController = controller;

    console.log("startRetriedFetch 'run' has triggered..");
    void pRetry(() => opts.fetcher(controller.signal), {
        retries: 1_000_000,
        factor: 2,
        minTimeout: INITIAL_RETRY_DELAY_MS,
        maxTimeout: MAX_RETRY_DELAY_MS,
        randomize: true,
        shouldRetry: (error: unknown) => !cancelled && !loaded && !isAbortError(error),
      })
      .then((data: T) => {
        if (cancelled || loaded || token !== runToken) return;
        opts.onSuccess(data);
        loaded = true;
      })
      .catch((error: unknown) => {
        if (cancelled || token !== runToken || isAbortError(error)) return;
        opts.onFailure(error);
      })
      .finally(() => {
        if (token === runToken) {
          activeController = null;
        }
      });
  };

  const onVisibilityChange = () => {
    if (document.visibilityState !== 'visible' || cancelled || loaded) return;
    run(true);
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  run();

  return () => {
    cancelled = true;
    activeController?.abort();
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
