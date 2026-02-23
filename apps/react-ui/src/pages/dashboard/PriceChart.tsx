import React, { useEffect, useMemo, useRef, useState } from "react";
import ButtonOne from "@/shared-components/ButtonOne";

import {
  createChart,
  LineSeries,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type CandlestickData,
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

  const [graphType, setGraphType] = useState<"Line" | "Candlestick">("Line");

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

  const candleData: CandlestickData[] = useMemo(() => {
    const byTime = new Map<UTCTimestamp, CandlestickData>();

    for (const data of ohlcvData) {
      const time = toUTCTimestamp(data.ts);
      const open = toFiniteNumber(data.open);
      const high = toFiniteNumber(data.high);
      const low = toFiniteNumber(data.low);
      const close = toFiniteNumber(data.close);

      if ([open, high, low, close].some(x => x === null)) continue;

      byTime.set(time, {
        time,
        open: open!,
        high: high!,
        low: low!,
        close: close!,
      });
    }

    return [...byTime.values()].sort((a, b) => Number(a.time) - Number(b.time));
  }, [ohlcvData])


  /* ------ update chart ------ */

  useEffect(() => {
    if (!chartRef.current) return;
    let series;
    let data;


    if (graphType === "Line") {
      data = lineData;
      series = LineSeries;
    }

    if (graphType === "Candlestick") {
      data = candleData;
      series = CandlestickSeries;
    }


    if(!seriesRef.current) {
      seriesRef.current = chartRef.current.addSeries(series, {
        color: "#2563eb",
        lineWidth: 2,
      });
    }

    // seriesRef.current.setData(data);



    // if (!seriesRef.current) {
    //   seriesRef.current = chartRef.current.addSeries(Series, {
    //     color: "#2563eb",
    //     lineWidth: 2,
    //   });
    // }

    // seriesRef.current.setData(data);
  }, [lineData, candleData, graphType]);

  return (
    <div className="h-full p-2 border rounded ">
      <header className="mb-3 flex items-center justify-between gap-3 relative">
          <ButtonOne
            variant="clear"
            className="ml-auto font-semibold"
            onClick={() => setGraphType(prev => prev === "Line" ? "Candlestick" : "Line")}
          >
            {graphType}
          </ButtonOne>
      </header>
      <div ref={containerRef} />
    </div>
  );
};

export default PriceChart;