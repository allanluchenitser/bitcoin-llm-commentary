import PriceChart from './PriceChart'
import BotSummary from './BotSummary';
import LiveEvents from './LiveEvents';

import {
  CHANNEL_TICKER_SNAPSHOT,
  CHANNEL_TICKER_UPDATE,
  type TickerSseEvent
} from '@blc/contracts';

import { useEffect, useState } from 'react';


const DashboardPage: React.FC = () => {
  const [sseStatus, setSseStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('connecting');

  const [rawEvents, setRawEvents] = useState<string[]>([]);
  const [tickerEvents, setTickerEvents] = useState<TickerSseEvent[]>([]);

  useEffect(() => {
    document.title = "Dashboard - Bitcoin LLM Commentary";
  }, []);

  useEffect(() => {
    // SSE connection with web-api
    const es = new EventSource('/sse/ticker');

    const onOpen = () => setSseStatus('open');
    const onError = () => setSseStatus('error');

    const onTicker = (e: MessageEvent) => {
      const raw = e.data;

      setRawEvents((prev) => [raw, ...prev].slice(0, 50));

      try {
        const parsed = JSON.parse(raw) as TickerSseEvent;
        setTickerEvents(prev => [parsed, ...prev].slice(0, 200))
      } catch {}
    }

    es.addEventListener('open', onOpen);
    es.addEventListener('error', onError);

    es.addEventListener(CHANNEL_TICKER_UPDATE, onTicker);
    es.addEventListener(CHANNEL_TICKER_SNAPSHOT, onTicker);

    return () => {
      es.removeEventListener('open', onOpen);
      es.removeEventListener('error', onError);
      es.removeEventListener(CHANNEL_TICKER_UPDATE, onTicker);
      es.removeEventListener(CHANNEL_TICKER_SNAPSHOT, onTicker);
      es.close();
      setSseStatus('closed');
    };
  }, []);

  return (
    <div className="container mx-auto px-4">
      <h2>Dashboard Page</h2>
      <p>This is the Dashboard Page of the Bitcoin LLM Commentary application.</p>
      <span className="font-semibold">SSE:</span> {sseStatus}

      <div className="flex mt-4">
        <div className="w-3/5">
          <div>
            <PriceChart events={tickerEvents} />
          </div>
          <div className="mt-4">
            <LiveEvents events={rawEvents} />
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