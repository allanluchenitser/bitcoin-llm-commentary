import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  type IChartApi,
  LineSeries,
  CandlestickSeries,
  type CandlestickData,
  type LineData,
  type UTCTimestamp
} from "lightweight-charts";

import { type TickerSseEvent } from "@blc/contracts";

function toUTCTimestamp(ts: unknown): UTCTimestamp {
  const n = typeof ts === "number" ? ts : typeof ts === "string" ? Number(ts) : NaN;

  // If it's ms (13 digits-ish), convert to seconds; if it's already seconds (10 digits), keep it.
  const seconds = n > 1e12 ? Math.floor(n / 1000) : Math.floor(n);

  return seconds as UTCTimestamp;
}

function toFiniteNumber(x: unknown): number | null {
  const n = typeof x === "number" ? x : typeof x === "string" ? Number(x) : NaN;
  return Number.isFinite(n) ? n : null;
}

type ChildProps = {
  events: TickerSseEvent[];
};

const BTC_USD = "BTC/USD";

const PriceChart: React.FC<ChildProps> = ({ events }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any | null>(null);

  const [seriesType, setSeriesType] = useState<"line" | "candles">("line");

  const lineData: LineData[] = useMemo(() => {
    // Keep the latest point per second (chart time resolution is seconds)
    const bySec = new Map<number, LineData>();

    for (const e of events) {
      if (e.symbol !== BTC_USD) continue;
      const t = toUTCTimestamp(e.ts_ms) as unknown as number;
      const value = toFiniteNumber((e.data as any)?.last);
      if (value === null) continue;

      bySec.set(t, { time: t as unknown as UTCTimestamp, value });
    }

    return [...bySec.values()].sort(
      (a, b) => (a.time as unknown as number) - (b.time as unknown as number)
    );
  }, [events]);

  useEffect(() => {
    console.log("lineData (first 5):", lineData.slice(0, 5));
  }, [lineData]);

  // Fake daily data (line)
  // const lineData = [
  //   { time: "2026-01-01", value: 42150 },
  //   { time: "2026-01-09", value: 45210 },
  //   { time: "2026-01-10", value: 45740 },
  // ];

  // Fake daily data (candles) – derived-ish from the same values
  const candleData: CandlestickData[] = [
    { time: "2026-01-01", open: 41800, high: 42550, low: 41550, close: 42150 },
    { time: "2026-01-02", open: 42150, high: 43000, low: 42000, close: 42800 },
    { time: "2026-01-03", open: 42800, high: 42950, low: 42100, close: 42425 },
    { time: "2026-01-04", open: 42425, high: 43400, low: 42350, close: 43110 },
    { time: "2026-01-05", open: 43110, high: 44300, low: 42950, close: 43990 },
    { time: "2026-01-06", open: 43990, high: 44120, low: 43200, close: 43550 },
    { time: "2026-01-07", open: 43550, high: 44850, low: 43400, close: 44620 },
    { time: "2026-01-08", open: 44620, high: 44700, low: 43850, close: 44180 },
    { time: "2026-01-09", open: 44180, high: 45550, low: 44100, close: 45210 },
    { time: "2026-01-10", open: 45210, high: 45950, low: 45000, close: 45740 },
  ];

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 240,
      layout: {
        background: { color: "#ffffff" },
        textColor: "#111827",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "#e5e7eb" },
        horzLines: { color: "#e5e7eb" },
      },
      rightPriceScale: {
        borderColor: "#e5e7eb",
      },
      timeScale: {
        borderColor: "#e5e7eb",
      },
    });

    chartRef.current = chart;

    const ro = new ResizeObserver(() => {
      if (!chartRef.current || !containerRef.current) return;
      chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (seriesRef.current) {
      chart.removeSeries(seriesRef.current);
      seriesRef.current = null;
    }

    if (seriesType === "line") {
      const series = chart.addSeries(LineSeries, {
        color: "#2563eb",
        lineWidth: 2,
      });
      series.setData(lineData);
      seriesRef.current = series;
    } else {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: "#16a34a",
        downColor: "#dc2626",
        wickUpColor: "#16a34a",
        wickDownColor: "#dc2626",
        borderVisible: false,
      });
      series.setData(candleData);
      seriesRef.current = series;
    }

    chart.timeScale().fitContent();
  }, [seriesType, lineData]); // <-- this is the key change

  return (
    <div className="h-full p-4 border rounded ">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-semibold">Price</h2>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSeriesType("line")}
            className={`px-2 py-1 rounded border text-sm ${
              seriesType === "line"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-900 border-gray-300"
            }`}
            aria-pressed={seriesType === "line"}
          >
            Line
          </button>
          <button
            type="button"
            onClick={() => setSeriesType("candles")}
            className={`px-2 py-1 rounded border text-sm ${
              seriesType === "candles"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-900 border-gray-300"
            }`}
            aria-pressed={seriesType === "candles"}
          >
            Candles
          </button>
        </div>
      </div>

      <div ref={containerRef} />
    </div>
  );
};

export default PriceChart;