import React, { useEffect, useRef } from "react";
import { createChart, type IChartApi, LineSeries } from "lightweight-charts";



const PriceChart: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 240,
      layout: {
        background: { color: "#ffffff" },
        textColor: "#111827",
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

    const series = chart.addSeries(LineSeries, {
      color: "#2563eb",
      lineWidth: 2,
    });

    // Fake daily data
    const data = [
      { time: "2026-01-01", value: 42150 },
      { time: "2026-01-02", value: 42800 },
      { time: "2026-01-03", value: 42425 },
      { time: "2026-01-04", value: 43110 },
      { time: "2026-01-05", value: 43990 },
      { time: "2026-01-06", value: 43550 },
      { time: "2026-01-07", value: 44620 },
      { time: "2026-01-08", value: 44180 },
      { time: "2026-01-09", value: 45210 },
      { time: "2026-01-10", value: 45740 },
    ];

    series.setData(data);
    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (!chartRef.current || !containerRef.current) return;
      chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);
  return (
    <div className="my-4 p-4 border rounded">
      <h2 className="mb-3 font-semibold">Price</h2>
      <div ref={containerRef} />
    </div>
  );
};

export default PriceChart;