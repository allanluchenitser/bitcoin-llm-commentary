import PriceChart from './PriceChart'
import BotSummary from './BotSummary';
import LiveEvents from './LiveEvents';
import Resizer from '@/shared-components/Resizer';
import './resizer-grid.css';

import {
  CHANNEL_TICKER_GENERIC,
  type OHLCVRow
} from '@blc/contracts';


import { useEffect, useState } from 'react';

const DashboardPage: React.FC = () => {
  const [sseStatus, setSseStatus] = useState<'connecting' | 'open' | 'closed' | 'error'>('connecting');
  const [ohlcvData, setOhlcvData] = useState<OHLCVRow[]>([]);

  // Resizer state
  const [leftWidth, setLeftWidth] = useState(60); // percent
  const [topHeight, setTopHeight] = useState(60); // percent

  useEffect(() => {
    document.title = "Dashboard - Bitcoin LLM Commentary";
  }, []);

  useEffect(() => {
    async function fetchHistory() {
      const res = await fetch('/db/history');
      const history = await res.json();

      console.log('Fetched historic trades:', history as OHLCVRow[]);
      setOhlcvData(history as OHLCVRow[]);
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
      <div className="resizer-grid mt-4" style={{ height: '70vh' }}>
        <div style={{ width: `${leftWidth}%`, transition: 'width 0.1s', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: `${topHeight}%`, transition: 'height 0.1s', minHeight: 100 }}>
            <PriceChart ohlcvData={ohlcvData} />
          </div>
          <Resizer
            direction="horizontal"
            onResize={delta => {
              setTopHeight(h => {
                const container = document.querySelector('.resizer-grid');
                if (!container) return h;
                const totalHeight = container.clientHeight;
                const newHeight = Math.max(10, Math.min(90, h + (delta / totalHeight) * 100));
                return newHeight;
              });
            }}
          />
          <div style={{ flex: 1, minHeight: 100 }}>
            <LiveEvents ohlcvData={ohlcvData} />
          </div>
        </div>
        <Resizer
          direction="vertical"
          onResize={delta => {
            setLeftWidth(w => {
              const container = document.querySelector('.resizer-grid');
              if (!container) return w;
              const totalWidth = container.clientWidth;
              const newWidth = Math.max(20, Math.min(80, w + (delta / totalWidth) * 100));
              return newWidth;
            });
          }}
        />
        <div style={{ width: `${100 - leftWidth}%`, transition: 'width 0.1s', minWidth: 100 }} className="ml-4 text-center">
          <div className="h-full">
            <BotSummary />
          </div>
        </div>
      </div>
    </div>
  )
};

export default DashboardPage;