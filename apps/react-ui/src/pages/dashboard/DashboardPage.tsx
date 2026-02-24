import PriceChart from './PriceChart'
import BotSummary from './BotSummary';
import LiveEvents from './LiveEvents';

import {
  CHANNEL_TICKER_GENERIC,
  type OHLCVRow
} from '@blc/contracts';


import { useEffect, useState } from 'react';

const DashboardPage: React.FC = () => {
  const [sseStatus, setSseStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('connecting');

  // const [rawEvents, setRawEvents] = useState<string[]>([]);
  const [ohlcvData, setOhlcvData] = useState<OHLCVRow[]>([]);

  useEffect(() => {
    document.title = "Dashboard - Bitcoin LLM Commentary";
  }, []);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/db/history');

        if(res.status !== 200) {
          console.log(res);
          throw new Error(`Failed to fetch historic trades, status: ${res.status}`);
        }

        const history = await res.json();

        // console.log('Fetched historic trades:', history as OHLCVRow[]);
        setOhlcvData(history as OHLCVRow[]);
      } catch (error) {
        throw error;
      }
    }
    fetchHistory();
  }, []);

  useEffect(() => {
    // SSE connection with web-api

    const es = new EventSource('/sse/trades');

    const onOpen = () => setSseStatus('open');
    const onError = () => setSseStatus('error');

    const onTicker = (sseEvent: MessageEvent) => {
      const subData = sseEvent.data; // SSE native data

      try {
        const parsed = JSON.parse(subData)

        if (parsed.type === "heartbeat") {
          console.log("Received heartbeat from server");
          return;
        }
        else {
          console.log("Received data event:", parsed);
          setOhlcvData(prev => [parsed as OHLCVRow, ...prev])
        }
      } catch {}
    }

    es.addEventListener('open', onOpen);
    es.addEventListener('error', onError);
    es.addEventListener(CHANNEL_TICKER_GENERIC, onTicker);

    return () => {
      es.removeEventListener('open', onOpen);
      es.removeEventListener('error', onError);
      es.removeEventListener(CHANNEL_TICKER_GENERIC, onTicker);
      es.close();
      setSseStatus('closed');
    };
  }, []);

  return (
    <div className="container mx-auto px-4">
      <span className="hidden font-semibold">SSE:</span><span className="hidden">{sseStatus}</span>
      <div className="flex mt-4">
        <div className="w-3/5">
          <div>
            <PriceChart ohlcvData={ohlcvData} />
          </div>
          <div className="mt-4">
            <LiveEvents ohlcvData={ohlcvData} />
          </div>
        </div>

        <div className="w-2/5 ml-4 text-center">
          <div className="h-full">
            <BotSummary />
          </div>
        </div>
      </div>
    </div>
  )
};

export default DashboardPage;