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
import type { OHLCV, OHLCVRow } from "@blc/contracts";
import clsx from "clsx";

function clearOHLCV(obj: OHLCV) {
  obj.ts = "";
  obj.exchange = "";
  obj.symbol = "";
  obj.open = 0;
  obj.high = 0;
  obj.low = 0;
  obj.close = 0;
  obj.volume = 0;
}

const aggObject: OHLCV = {
  ts: "",
  exchange: "",
  symbol: "",
  open: 0,
  high: 0,
  low: 0,
  close: 0,
  volume: 0,
};

const PriceChart: React.FC<{ ohlcvData: OHLCVRow[] }> = ({ ohlcvData }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | ISeriesApi<"Candlestick"> | null >(null);

  const [intervalSelection, setIntervalSelection] = useState<"1m" | "15m" | "1h" | "1d">("1m");

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

  /*
    if interval selection === 1m, use original
    if interval selection === 15m, aggregate 15 minutes into 1 element
    if interval selection === 1h, aggregate 1h into 1 element
    if interval selection === 1d, aggregate 1d into 1 element
  */
  const aggregateData = useMemo(() => {
    const interval = parseInt(intervalSelection);
    if (interval === 1) return ohlcvData;

    const aggArray: OHLCV[] = [];

    for (const [index, data] of ohlcvData.entries()) {

      /* --- for all subintervals --- */

      const low = parseInt(data.low);
      const high = parseInt(data.high);

      if (high > aggObject.high) aggObject.high = high;
      if (low < aggObject.low) aggObject.low = low;
      aggObject.volume += parseInt(data.volume);

      /* --- for special subintervals --- */

      const isFirstSub = index % interval === 0;
      const isLastSub = index % interval === interval - 1;
      const noMoreElements = (index + 1) in ohlcvData === false;

      if (isFirstSub) {
        aggObject.exchange = data.exchange;
        aggObject.symbol = data.symbol;
        aggObject.ts = data.ts;
        aggObject.open = parseInt(data.open);
      }

      if (isLastSub || noMoreElements) {
        aggObject.close = parseInt(data.close)
        aggArray.push({ ...aggObject })
        clearOHLCV(aggObject);
      }
    } // end for

    return aggArray;
  }, [ohlcvData, intervalSelection]);

  const lineData: LineData[] = useMemo(() => {
    const bySec = new Map<UTCTimestamp, LineData>();

    for (const data of aggregateData) {
      const ts = toUTCTimestamp(data.ts)
      const lastPrice = toFiniteNumber(data.close);
      if (lastPrice === null) continue;
      bySec.set(ts, { time: ts, value: lastPrice });
    }

    return [...bySec.values()].sort(
      (a, b) => Number(a.time) - Number(b.time)
    );
  }, [aggregateData]);

  const candleData: CandlestickData[] = useMemo(() => {
    const byTime = new Map<UTCTimestamp, CandlestickData>();

    for (const data of aggregateData) {
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

      console.log("Processed candle data:", ob);

      byTime.set(time, ob);
    }

    return [...byTime.values()].sort((a, b) => Number(a.time) - Number(b.time));
  }, [aggregateData])


  /* ------ update chart ------ */

  useEffect(() => {
    if (!chartRef.current) return;

    const isGraphTypeChange = graphType !== seriesRef.current?.seriesType();

    if (seriesRef.current && isGraphTypeChange) {
      chartRef.current.removeSeries(seriesRef.current);
      seriesRef.current = null;
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
  }, [lineData, candleData, graphType]);

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
            onClick={() => setIntervalSelection("1m")}>
              1m
          </button>
          <button
            className={
              clsx(
                buttonBasicTw,
                { "bg-gray-900 text-white": intervalSelection === "15m" }
              )
            }
            onClick={() => setIntervalSelection("15m")}>
              15m
          </button>
          <button
            className={
              clsx(
                buttonBasicTw,
                { "bg-gray-900 text-white": intervalSelection === "1h" }
              )
            }
            onClick={() => setIntervalSelection("1h")}
          >
              1h
          </button>
          <button
            className={
              clsx(
                buttonBasicTw,
                { "bg-gray-900 text-white": intervalSelection === "1d" }
              )
            }
            onClick={() => setIntervalSelection("1d")}>
              1d
          </button>
        </div>
        {/* <h2 className="text-sm font-semibold">Price Chart</h2> */}
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