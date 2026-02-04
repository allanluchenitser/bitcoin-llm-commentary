import PriceChart from './PriceChart'
import BotSummary from './BotSummary';
import LiveEvents from './LiveEvents';

import { useEffect, useState } from 'react';

const DashboardPage: React.FC = () => {
  const [sseStatus, setSseStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('connecting');
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    document.title = "Dashboard - Bitcoin LLM Commentary";
  }, []);

  useEffect(() => {
    // SSE connection with web-api
    const es = new EventSource('/sse/ticker');

    const onOpen = () => setSseStatus('open');
    const onError = () => setSseStatus('error');

    es.addEventListener('open', onOpen);
    es.addEventListener('error', onError);

    es.addEventListener('ticker:update', (e) => {
      console.log('SSE message update:', e);
      setEvents((prev) => [String(e.data), ...prev].slice(0, 50));
    });

    es.addEventListener('ticker:snapshot', (e) => {
      console.log('SSE message snapshot:', e);
      setEvents((prev) => [String(e.data), ...prev].slice(0, 50));
    });

    return () => {
      es.removeEventListener('open', onOpen);
      es.removeEventListener('error', onError);
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
            <PriceChart />
          </div>
          <div className="mt-4">
            <LiveEvents events={events} />
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