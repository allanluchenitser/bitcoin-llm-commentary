import PriceChart from '@/shared-components/PriceChart'
import BotSummary from '@/shared-components/BotSummary';

import { useEffect, useState } from 'react';

const DashboardPage: React.FC = () => {
  const [sseStatus, setSseStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('connecting');
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    document.title = "Dashboard - Bitcoin LLM Commentary";
  }, []);

  useEffect(() => {
    // Point this at an SSE endpoint your backend exposes.
    // Keep it same-origin (e.g. "/api/sse") to avoid CORS headaches during dev.
    const url = "/api/v1/sse";

    const es = new EventSource(url);

    const onOpen = () => setSseStatus('open');
    const onError = () => setSseStatus('error');

    es.addEventListener('open', onOpen);
    es.addEventListener('error', onError);

    // Default SSE event ("message")
    es.addEventListener('message', (e) => {
      setEvents((prev) => [String(e.data), ...prev].slice(0, 50));
    });

    // Optional: listen for a named event the server sends, e.g. "price"
    // es.addEventListener('price', (e) => {
    //   setEvents((prev) => [`price: ${String(e.data)}`, ...prev].slice(0, 50));
    // });

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

      <div className="my-3 text-sm">
        <span className="font-semibold">SSE:</span> {sseStatus}
      </div>

      <div className="flex">
        <div className="flex-2">
          <PriceChart />
        </div>

        <div className="flex-1 ml-4 text-center">
          <BotSummary />

          <div className="text-lg font-semibold mb-2">
            <div className="border rounded p-2 h-48 overflow-auto bg-white">
            <h3 >Live Events</h3>
              {events.length === 0 ? (
                <div className="text-gray-500">No events yet…</div>
              ) : (
                <ul className="text-xs space-y-1">
                  {events.map((x, i) => (
                    <li key={i} className="font-mono break-words">{x}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
};

export default DashboardPage;