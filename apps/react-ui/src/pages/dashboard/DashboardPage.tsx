import PriceChart from './PriceChart'
import BotSummary from './BotSummary';
import LiveEvents from './LiveEvents';

import {
  CHANNEL_TICKER_GENERIC,
  type KrakenEvent,
  type OHLCVRow
} from '@blc/contracts';

import { type KrakenTickerEvent } from './dashboard-types';

import { useEffect, useState } from 'react';

const DashboardPage: React.FC = () => {
  const [sseStatus, setSseStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('connecting');

  // const [rawEvents, setRawEvents] = useState<string[]>([]);
  const [tickerEvents, setTickerEvents] = useState<KrakenTickerEvent[]>([]);
  const [allEvents, setAllEvents] = useState<KrakenEvent[]>([]);

  useEffect(() => {
    document.title = "Dashboard - Bitcoin LLM Commentary";
  }, []);

  useEffect(() => {
    async function fetchHistory() {
      const res = await fetch('/db/history');
      const history = await res.json();

      console.log('Fetched history:', history as OHLCVRow[]);
      // setTickerEvents(history); // or process as needed
      // setAllEvents(history);    // or process as needed
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
        setAllEvents(prev => [parsed, ...prev])
        if(parsed.channel === "ticker") {
          setTickerEvents(prev => [parsed as KrakenTickerEvent, ...prev])
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
      <span className="font-semibold">SSE:</span> {sseStatus}

      <div className="flex mt-4">
        <div className="w-3/5">
          <div>
            <PriceChart events={tickerEvents} />
          </div>
          <div className="mt-4">
            {/* <LiveEvents events={allEvents} /> */}
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