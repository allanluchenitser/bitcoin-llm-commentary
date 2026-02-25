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
} from "./dashboardHelpers";

// import { type KrakenTickerEvent } from './dashboard-types';
import type { OHLCV } from "@blc/contracts";
import clsx from "clsx";

type PriceChartProps = {
  ohlcvData: OHLCV[];

  intervalSelection: "1m" | "15m" | "60m" | "1440m";
  onChangeInterval: (interval: "1m" | "15m" | "60m" | "1440m") => void;

  graphType: "Line" | "Candlestick";
  onChangeGraphType: (graphType: "Line" | "Candlestick") => void;
}

const PriceChart: React.FC<PriceChartProps> = ({
  ohlcvData,
  intervalSelection,
  graphType,
  onChangeInterval,
  onChangeGraphType
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const seriesRef = useRef<ISeriesApi<"Line"> | ISeriesApi<"Candlestick"> | null >(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null >(null);

  // const [intervalSelection, setIntervalSelection] = useState<"1m" | "15m" | "60m" | "1440m">("1m");

  // const [graphType, setGraphType] = useState<"Line" | "Candlestick">("Line");

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
      volumeSeriesRef.current = null;
    };
  }, []);

  /* ------ chart data ------ */

  const lineData: LineData[] = useMemo(() => {
    const bySec = new Map<UTCTimestamp, LineData>();

    for (const data of ohlcvData) {
      const ts = toUTCTimestamp(data.ts)
      const lastPrice = toFiniteNumber(data.close);
      bySec.set(ts, { time: ts, value: lastPrice || 0 });
    }

    return [...bySec.values()];
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
  }, [ohlcvData]);

  const volumeData: HistogramData[] = useMemo(() => {
    return ohlcvData.map((data) => ({
      time: toUTCTimestamp(data.ts),
      value: toFiniteNumber(data.volume) ?? 0,
      color: "#a3a3a3", // or use green/red based on price movement if you want
    }));
  }, [ohlcvData]);

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

    // always a volume series histo in the back brah
    if (!volumeSeriesRef.current || isGraphTypeChange) {
      volumeSeriesRef.current = chartRef.current.addSeries(HistogramSeries, {
        color: "#a3a3a3",
        priceFormat: { type: "volume" },
        priceScaleId: "left",
        lastValueVisible: false,
        priceLineVisible: false,
      });
      volumeSeriesRef.current.setData(volumeData);
    }
    else if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(volumeData);
    }

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

  const buttonBasicTw = "px-1 py-0.5 rounded text-gray-500";
  return (
    <div className="h-full p-2 border rounded ">
      <header className="mb-3 flex items-center justify-between gap-3 relative">
        <div className={
          clsx(
            "intervals flex absolute -top-1 -left-1 text-xs rounded px-1 py-0.5 gap-1 [&>button]:cursor-pointer",
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
          <button
            className={
              clsx(
                buttonBasicTw,
                { "bg-gray-900 text-white": intervalSelection === "1440m" }
              )
            }
            onClick={() => onChangeInterval("1440m")}>
              1d
          </button>
        </div>
        {/* <h2 className="text-sm font-semibold">Price Chart</h2> */}
          <ButtonOne
            variant="clear"
            className="ml-auto font-semibold"
            onClick={() => onChangeGraphType(graphType === "Line" ? "Candlestick" : "Line")}
          >
            {graphType}
          </ButtonOne>
      </header>
      <div ref={containerRef} />
    </div>
  );
};

export default PriceChart;