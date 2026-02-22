import React, { useEffect, useMemo, useRef } from "react";
import {
  createChart,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type UTCTimestamp
} from "lightweight-charts";

import {
  toFiniteNumber,
  toUTCTimestamp,
} from "./dashboardHelpers";

// import { type KrakenTickerEvent } from './dashboard-types';
import type { OHLCVRow } from "@blc/contracts";

const PriceChart: React.FC<{ ohlcvData: OHLCVRow[] }> = ({ ohlcvData }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | ISeriesApi<"Candlestick"> | null >(null);

  /* ------ setup chart ------ */

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
        // vertLines: { color: "#e5e7eb" },
        // horzLines: { color: "#e5e7eb" },
      },
      rightPriceScale: {
        borderColor: "#e5e7eb",
      },
      timeScale: {
        borderColor: "#e5e7eb",
        timeVisible: true,
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

  /* ------ chart data ------ */

  const lineData: LineData[] = useMemo(() => {
    const bySec = new Map<UTCTimestamp, LineData>();

    for (const data of ohlcvData) {
      const ts = toUTCTimestamp(data.ts)
      const lastPrice = toFiniteNumber(data.close);
      if (lastPrice === null) continue;
      bySec.set(ts, { time: ts, value: lastPrice });
    }

    return [...bySec.values()].sort(
      (a, b) => Number(a.time) - Number(b.time)
    );
  }, [ohlcvData]);

  /* ------ update chart ------ */

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    let series = seriesRef.current;

    if (!series) {
      series = chart.addSeries(LineSeries, {
        color: "#2563eb",
        lineWidth: 2,
      });
      seriesRef.current = series;
    }

    series.setData(lineData);

    chart.timeScale().fitContent();
  }, [lineData]);

  return (
    <div className="h-full p-4 border rounded ">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-semibold">Price</h2>

        <div className="flex gap-2">
          <button
            type="button"
            className="px-2 py-1 rounded border text-sm bg-gray-900 text-white border-gray-900"
          >
            Line
          </button>
        </div>
      </header>

      <div ref={containerRef} />
    </div>
  );
};

export default PriceChart;