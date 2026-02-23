import React, { useEffect, useMemo, useRef } from "react";
import ButtonOne from "@/shared-components/ButtonOne";

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

  /* ------ init chart library ------ */

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
        vertLines: { color: "transparent" },
        horzLines: { color: "transparent" },
      },
      crosshair: {
        vertLine: { color: "transparent" },
        horzLine: { color: "transparent" },
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
    if (!chartRef.current) return;

    if (!seriesRef.current) {
      seriesRef.current = chartRef.current.addSeries(LineSeries, {
        color: "#2563eb",
        lineWidth: 2,
      });
    }

    seriesRef.current.setData(lineData);
  }, [lineData]);

  return (
    <div className="h-full p-2 border rounded ">
      <header className="mb-3 flex items-center justify-between gap-3 relative">
          <ButtonOne
            variant="clear"
            className="ml-auto font-semibold"
          >
            LINE
          </ButtonOne>
      </header>
      <div ref={containerRef} />
    </div>
  );
};

export default PriceChart;