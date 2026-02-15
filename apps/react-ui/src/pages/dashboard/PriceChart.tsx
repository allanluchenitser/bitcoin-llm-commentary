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
import type { KrakenTickerEvent, KrakenTickerData } from "@blc/contracts/ticker";

const PriceChart: React.FC<{ events: KrakenTickerEvent[] }> = ({ events }) => {
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

  /* ------ chart data ------ */

  const lineData: LineData[] = useMemo(() => {
    const bySec = new Map<UTCTimestamp, LineData>();

    for (const e of events) {
      const data = (e.data as KrakenTickerData[])[0]; // this is based on KrakenTickerEvent structure, where data is an array of KrakenTickerData, we take the first one for simplicity
      const t = toUTCTimestamp(data.timestamp)
      const lastPrice = toFiniteNumber(data.last);
      if (lastPrice === null) continue;
      bySec.set(t, { time: t, value: lastPrice });
    }

    return [...bySec.values()].sort(
      (a, b) => Number(a.time) - Number(b.time)
    );
  }, [events]);

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