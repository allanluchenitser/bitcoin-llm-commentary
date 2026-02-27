import PriceChart from './PriceChart'
import BotSummary from './BotSummary';
import LiveEvents from './LiveEvents';

import {
  CHANNEL_TICKER_OHLCV,
  ohclvRows2Numbers,
  type OHLCVRow,
  type OHLCV,
  type LLMCommentary
} from '@blc/contracts';

import { useEffect, useState, useMemo } from 'react';

import { useSseSetup } from './useSseSetup';

type sseStatuses = 'connecting' | 'open' | 'closed' | 'error';

const DashboardPage: React.FC = () => {
  const [sseTradesStatus, setSseTradesStatus] = useState<sseStatuses>('connecting');
  const [sseSummariesStatus, setSseSummariesStatus] = useState<sseStatuses>('connecting');

  const [intervalSelection, setIntervalSelection] = useState<"1m" | "15m" | "60m" | "1440m">("1m");
  const [graphType, setGraphType] = useState<"Line" | "Candlestick">("Line");

  const [rawOhlcvData, setRawOhlcvData] = useState<OHLCV[]>([]);
  const [summaries, setSummaries] = useState<LLMCommentary[]>([]);

  useEffect(() => {
    document.title = "Dashboard - Bitcoin LLM Commentary";
  }, []);

  useEffect(() => {
    async function fetchPriceHistory() {
      try {
        const res = await fetch('/db/history');

        if(res.status !== 200) {
          console.log(res);
          throw new Error(`Failed to fetch historic trades, status: ${res.status}`);
        }

        const history = await res.json();
        const mapped: OHLCV[] = ohclvRows2Numbers(history as OHLCVRow[]);

        setRawOhlcvData(mapped);
      } catch (error) {
        throw error;
      }
    }
    fetchPriceHistory();
  }, []);

  useEffect(() => {
    async function fetchLLMHistory() {
      try {
        const res = await fetch('/llm/history');
        if(res.status !== 200) {
          console.log(res);
          throw new Error(`Failed to fetch historic summaries, status: ${res.status}`);
        }

        const history = await res.json();
        setSummaries(history as LLMCommentary[]);
      } catch (error) {
        throw error;
      }
    }
    fetchLLMHistory();
  }, []);

  // SSE trades from web-api
  useSseSetup({
    path: '/sse/trades',
    channel: CHANNEL_TICKER_OHLCV,
    onStatus: setSseTradesStatus,
    onUpdate: (sseEvent) => {
      const subData = sseEvent.data; // SSE native data

      try {
        const parsed = JSON.parse(subData);

        if (parsed.type === "heartbeat") {
          console.log("Received heartbeat from server");
          return;
        }
        else {
          const mapped = ohclvRows2Numbers([parsed as OHLCVRow])[0];
          setRawOhlcvData(prev => [...prev, mapped].sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts)));
        }
      } catch {}
    }
  });

  // SSE summaries from llm-lambda-worker
  useSseSetup({
    path: '/sse/summaries',
    channel: 'summary',
    onStatus: setSseSummariesStatus,
    onUpdate: (sseEvent) => {
      try {
        const parsed = JSON.parse(sseEvent.data);
        console.log("Received summary event:", parsed);
        setSummaries(prev => [...prev, parsed as LLMCommentary].sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts)));
      } catch {}
    }
  });

  const processedOHCLV = useMemo(() => {
    const interval = parseInt(intervalSelection);
    if (interval === 1) {
      const sorted = [...rawOhlcvData].sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
      return sorted;
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

    const sorted = aggArray.sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
    return sorted;
  }, [rawOhlcvData, intervalSelection]);

  return (
    <div className="container mx-auto px-4">
      <span className="hidden font-semibold">SSE:</span><span className="hidden">{sseTradesStatus}</span>
      <span className="hidden font-semibold">SSE:</span><span className="hidden">{sseSummariesStatus}</span>
      <div className="flex mt-4">
        <div className="w-3/5">
          <div>
            <PriceChart
              ohlcvData={processedOHCLV}
              intervalSelection={intervalSelection}
              graphType={graphType}
              onChangeInterval={setIntervalSelection}
              onChangeGraphType={setGraphType}
            />
          </div>
          <div className="mt-4">
            <LiveEvents
              ohlcvData={processedOHCLV}
            />
          </div>
        </div>

        <div className="w-2/5 ml-4 text-center">
          <div className="h-full">
            <BotSummary summaries={summaries} />
          </div>
        </div>
      </div>
    </div>
  )
};

export default DashboardPage;