import PriceChart from './dashboard_components/PriceChart'
import BotSummary from './dashboard_components/BotSummary';
import LiveEvents from './dashboard_components/LiveEvents';
import DoombergLiveLogo from './DoombergLiveLogo';

import {
  CHANNEL_TICKER_OHLCV,
  ohclvRows2Numbers,
  type OHLCVRow,
  type OHLCV,
  type LLMCommentary
} from '@blc/contracts';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useSseSetup } from '@/hooks/useSseSetup';
import { startRetriedFetch } from './dashboardHelpers';

const MAX_SUMMARIES = 50;

const DashboardPage: React.FC = () => {
  const [intervalSelection, setIntervalSelection] = useState<"1m" | "15m" | "60m" | "1440m">("1m");
  const [graphType, setGraphType] = useState<"Line" | "Candlestick">("Line");

  const [rawOhlcvData, setRawOhlcvData] = useState<OHLCV[]>([]);
  const [summaries, setSummaries] = useState<LLMCommentary[]>([]);

  const [sseLoadSim, setSseLoadSim] = useState(false);

  useEffect(() => {
    document.title = "Doomberg | Live - Bitcoin LLM Commentary";
  }, []);

  /* ------ vertical drag / resizer for LiveEvents ------ */

  const LOCAL_KEY = "dashboard_liveEventsHeight";
  const [liveEventsHeight, setLiveEventsHeight] = useState(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    return saved ? Number(saved) : 240;
  });

  const leftColRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);
  const debounceRef = useRef<number | null>(null);

  const MIN_LIVE = 120;
  const MIN_CHART = 180;

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, String(liveEventsHeight));
  }, [liveEventsHeight]);

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      if (!dragRef.current || !leftColRef.current) return;

      const { startY, startHeight } = dragRef.current;
      const dy = e.clientY - startY;
      const next = startHeight - dy;

      const total = leftColRef.current.clientHeight;
      const maxLive = Math.max(MIN_LIVE, total - MIN_CHART);
      const clamped = Math.max(MIN_LIVE, Math.min(maxLive, next));

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setLiveEventsHeight(clamped);
      }, 20);
    }

    function onPointerUp() {
      dragRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  function onResizeHandlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    console.log("Pointer down on resize handle");
    dragRef.current = { startY: e.clientY, startHeight: liveEventsHeight };
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }

  /* ------ Initial data fetch, management ------ */

  useEffect(() => {
    return startRetriedFetch<OHLCVRow[]>({
      fetcher: async (signal) => {
        const res = await fetch('/db/history?limit=2000', { signal });
        if (res.status !== 200) {
          throw new Error(`Failed to fetch historic trades, status: ${res.status}`);
        }

        return res.json() as Promise<OHLCVRow[]>;
      },
      onSuccess: (history) => {
        const mapped: OHLCV[] = ohclvRows2Numbers(history);
        setRawOhlcvData(mapped);
      },
      onFailure: (error) => {
        console.error(error);
      },
    });
  }, []);

  useEffect(() => {
    return startRetriedFetch<LLMCommentary[]>({
      fetcher: async (signal) => {
        const res = await fetch('/llm/history', { signal });
        if (res.status !== 200) {
          throw new Error(`Failed to fetch historic summaries, status: ${res.status}`);
        }

        return res.json() as Promise<LLMCommentary[]>;
      },
      onSuccess: (history) => {
        setSummaries(history);
      },
      onFailure: (error) => {
        console.error(error);
      },
    });
  }, []);

  useEffect(() => {
    if (rawOhlcvData.length > 2000) {
      setRawOhlcvData(prev => prev.slice(0, 2000));
    }
  }, [rawOhlcvData]);

  useEffect(() => {
    if (summaries.length > MAX_SUMMARIES) {
      setSummaries(prev => prev.slice(0, MAX_SUMMARIES));
    }
  }, [summaries]);

  /* ------ SSE subscriptions: price updates and LLM summaries ------ */

  const tradeHandler = (sseEvent: MessageEvent): void => {
    const rawOhlcv = sseEvent.data; // SSE native data

    try {
      const parsedOhlcv = JSON.parse(rawOhlcv);

      if (parsedOhlcv.type === "heartbeat") {
        console.log("Received heartbeat from server");
        return;
      }
      else {
        const mappedOhlcv = ohclvRows2Numbers([parsedOhlcv as OHLCVRow])[0];
        console.log("Received OHLCV update:", mappedOhlcv);
        setRawOhlcvData(prev => [mappedOhlcv, ...prev]);
      }
    } catch {}
  }

  useSseSetup({
    path: '/sse/trades',
    channels: [CHANNEL_TICKER_OHLCV],
    onUpdates: [tradeHandler]
  });

  function summaryHandler(sseEvent: MessageEvent): void {
    try {
      const parsed = JSON.parse(sseEvent.data);
      setSseLoadSim(true);

      setTimeout(() => {
        setSummaries(prev => [parsed as LLMCommentary, ...prev]);
        setSseLoadSim(false)
      }, Math.random() * 2000 + 500);
    } catch {}
  }

  useSseSetup({
    path: '/sse/summaries',
    channels: 'summary',
    onUpdates: summaryHandler
  });

  /* ------ Data processing for charts and tables ------ */

  const processedOHCLV = useMemo(() => {
    const interval = parseInt(intervalSelection);
    if (interval === 1) {
      return [...rawOhlcvData];
    }

    const aggArray: OHLCV[] = [];
    for (let i = 0; i < rawOhlcvData.length; i += interval) {
      const group = rawOhlcvData.slice(i, i + interval);
      if (group.length === 0) continue;

      const open = group[0].open;
      const close = group[group.length - 1].close;
      const high = Math.max(...group.map(d => d.high));
      const low = Math.min(...group.map(d => d.low));
      const volume = group.reduce((sum, d) => sum + d.volume, 0);

      aggArray.push({
        ts: group[0].ts,
        exchange: group[0].exchange,
        symbol: group[0].symbol,
        open,
        close,
        high,
        low,
        volume,
      });
    }

    return aggArray;
  }, [rawOhlcvData, intervalSelection]);

  /* ------ Render ------ */

  return (
    <div className="blc-dashboard-page flex mx-auto px-4 h-dvh pt-4 overflow-hidden">
      <div
        ref={leftColRef}
        className="w-3/5 flex flex-col gap-2 h-dvh min-h-0 overflow-hidden"
      >
        <PriceChart
          className="flex-1 min-h-0"
          ohlcvData={processedOHCLV}
          intervalSelection={intervalSelection}
          graphType={graphType}
          onChangeInterval={setIntervalSelection}
          onChangeGraphType={setGraphType}
        />

        {/* ------ resizer handle ------ */}

        <div
          role="separator"
          aria-orientation="horizontal"
          onPointerDown={onResizeHandlePointerDown}
          className="h-3 shrink-0 cursor-row-resize flex items-center justify-center bg-white"
          style={{ touchAction: "none" }}
        >
          <div className="h-1 w-12 rounded-full bg-gray-300" />
        </div>

        <LiveEvents
          className="shrink-0 overflow-auto"
          ohlcvData={processedOHCLV}
          style={{ height: `${liveEventsHeight}px` }}
        />
        <DoombergLiveLogo className="fixed bottom-2 left-2" />
      </div>
      <div className="w-2/5 ml-4 text-center overflow-y-auto thin-scrollbar">
        <BotSummary summaries={summaries} loading={sseLoadSim} />
      </div>
    </div>
  )
};

export default DashboardPage;