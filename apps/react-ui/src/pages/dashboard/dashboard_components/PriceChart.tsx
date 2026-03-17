import React, { useEffect, useMemo, useRef } from "react";
import ButtonOne from "@/shared-components/ButtonOne";

import {
  createChart,
  LineSeries,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type CandlestickData,
  type HistogramData,
  type UTCTimestamp,
  CrosshairMode
} from "lightweight-charts";

import {
  toFiniteNumber,
  toUTCTimestamp,
} from "../dashboardHelpers";

import type { OHLCV } from "@blc/contracts";
import clsx from "clsx";

type PriceChartProps = {
  ohlcvData: OHLCV[];

  intervalSelection: "1m" | "15m" | "60m" | "1440m";
  onChangeInterval: (interval: "1m" | "15m" | "60m" | "1440m") => void;

  graphType: "Line" | "Candlestick";
  onChangeGraphType: (graphType: "Line" | "Candlestick") => void;

  className?: string;
}

const PriceChart = ({
  ohlcvData,
  intervalSelection,
  graphType,
  onChangeInterval,
  onChangeGraphType,
  className = "",
}: PriceChartProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const seriesRef = useRef<ISeriesApi<"Line"> | ISeriesApi<"Candlestick"> | null >(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null >(null);

  const initialRangeRef = useRef<{ from: number; to: number } | null>(null);

  const ascendingOhlcvData = useMemo(
    () => [...ohlcvData].sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts)),
    [ohlcvData]
  );

  /* ------ init chart library ------ */

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const chart = createChart(container, {
      autoSize: true,
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
        mode: CrosshairMode.Normal
      },
      rightPriceScale: {
        borderColor: "#e5e7eb",
        scaleMargins: { top: 0.2, bottom: 0.2 },
      },
      leftPriceScale: { // <-- add this
        borderColor: "#e5e7eb",
        visible: false,
        scaleMargins: { top: 0.2, bottom: 0 },
      },
      timeScale: {
        borderColor: "#e5e7eb",
        timeVisible: true,
      },
    });

    chartRef.current = chart;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  useEffect(() => { // ui: fit chart on interval change
    if (chartRef.current && initialRangeRef.current && (intervalSelection === "1m")) {
      chartRef.current.timeScale().setVisibleLogicalRange(initialRangeRef.current);
    }
    else if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [intervalSelection]);

  /* ------ mappings of ohlcvData: line, candle, volume ------ */

  const lineData: LineData[] = useMemo(() => {
    const bySec = new Map<UTCTimestamp, LineData>();

    for (const data of ascendingOhlcvData) {
      const ts = toUTCTimestamp(data.ts)
      const lastPrice = toFiniteNumber(data.close);
      bySec.set(ts, { time: ts, value: lastPrice || 0 });
    }

    return [...bySec.values()];
  }, [ascendingOhlcvData]);

  const candleData: CandlestickData[] = useMemo(() => {
    const byTime = new Map<UTCTimestamp, CandlestickData>();

    for (const data of ascendingOhlcvData) {
      const time = toUTCTimestamp(data.ts);
      const open = toFiniteNumber(data.open);
      const high = toFiniteNumber(data.high);
      const low = toFiniteNumber(data.low);
      const close = toFiniteNumber(data.close);

      if ([open, high, low, close].some(x => x === null)) continue;

      const ob = {
        time,
        open: open!,
        high: high!,
        low: low!,
        close: close!,
      }

      byTime.set(time, ob);
    }

    return [...byTime.values()];
  }, [ascendingOhlcvData]);

  const volumeData: HistogramData[] = useMemo(() => {
    return ascendingOhlcvData.map((data) => ({
      time: toUTCTimestamp(data.ts),
      value: toFiniteNumber(data.volume) ?? 0,
      color: "#d1d1d1",
    }));
  }, [ascendingOhlcvData]);

  /* ------ update chart ------ */

  useEffect(() => {
    if (!chartRef.current) return;

    const isGraphTypeChange = graphType !== seriesRef.current?.seriesType();

    if (seriesRef.current && isGraphTypeChange) {
      chartRef.current.removeSeries(seriesRef.current);
      seriesRef.current = null;
    }

    if (volumeSeriesRef.current && isGraphTypeChange) {
      chartRef.current.removeSeries(volumeSeriesRef.current);
      volumeSeriesRef.current = null;
    }

  /* ------ volume series is always visible ------ */

    if (!volumeSeriesRef.current || isGraphTypeChange) {
      volumeSeriesRef.current = chartRef.current.addSeries(HistogramSeries, {
        color: "#a3a3a3",
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
        lastValueVisible: false,
        priceLineVisible: false,
      });
      volumeSeriesRef.current.setData(volumeData);

      chartRef.current.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.6, bottom: 0 },
      });

      if (!initialRangeRef.current) {
        initialRangeRef.current = chartRef.current.timeScale().getVisibleLogicalRange();
      }
    }
    else if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(volumeData);
    }

  /* ---- main series (line or candlestick) ------ */

    if ((!seriesRef.current || isGraphTypeChange) && graphType === "Line") {
      seriesRef.current = chartRef.current.addSeries(LineSeries, {
        color: "#2563eb",
        lineWidth: 2,
      });
      return seriesRef.current.setData(lineData);
    }

    if ((!seriesRef.current || isGraphTypeChange) && graphType === "Candlestick") {
      seriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
        upColor: "#16a34a",
        downColor: "#dc2626",
        borderVisible: false,
      });
      return seriesRef.current.setData(candleData);
    }

    if (seriesRef.current && graphType === "Line") {
      seriesRef.current.setData(lineData);
    }
    else if (seriesRef.current && graphType === "Candlestick") {
      seriesRef.current.setData(candleData);
    }
  }, [lineData, candleData, volumeData, graphType]);

/* ------ render ------ */

  const buttonBasicTw = "px-1 py-0.5 rounded text-gray-500";

  return (
    <div className={`${className} min-h-0 flex flex-col`}>
      <header className="shrink-0 flex-[0_0_auto] flex items-center justify-between gap-3 mb-3 relative">
        <div className={
          clsx(
            "intervals flex absolute",
            "-top-1 -left-1 gap-1",
            "text-xs rounded px-1 py-0.5 [&>button]:cursor-pointer",
          )
        }>
          <button
            className={
              clsx(
                buttonBasicTw,
                { "bg-gray-900 text-white": intervalSelection === "1m" }
              )
            }
            onClick={() => onChangeInterval("1m")}>
              1m
          </button>
          <button
            className={
              clsx(
                buttonBasicTw,
                { "bg-gray-900 text-white": intervalSelection === "15m" }
              )
            }
            onClick={() => onChangeInterval("15m")}>
              15m
          </button>
          <button
            className={
              clsx(
                buttonBasicTw,
                { "bg-gray-900 text-white": intervalSelection === "60m" }
              )
            }
            onClick={() => onChangeInterval("60m")}
          >
              1h
          </button>
        </div>
        <ButtonOne
          variant="clear"
          className="ml-auto font-semibold"
          onClick={() => onChangeGraphType(graphType === "Line" ? "Candlestick" : "Line")}
        >
          {graphType}
        </ButtonOne>
      </header>
      <div
        id="price-chart-container"
        ref={containerRef}
        className="flex-1 min-h-0"
      ></div>
    </div>
  );
};

export default PriceChart;