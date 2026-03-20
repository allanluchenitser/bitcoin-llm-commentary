import { useEffect, useMemo, useRef, useState } from "react";
import {
  INITIAL_RECONNECT_DELAY_MS,
  LIVE_EVENTS_MAX_ROWS,
  MAX_RECONNECT_DELAY_MS,
} from "./live-events-config";
import { exchangeAdapters } from "./exchanges";
import {
  type ExchangeId,
  type NormalizedTrade,
  type StreamConnectionState,
} from "./types";

type ExchangeStatusMap = Record<ExchangeId, StreamConnectionState>;

type LiveTradeStreamState = {
  trades: NormalizedTrade[];
  statuses: ExchangeStatusMap;
};

const nextDelay = (currentDelay: number) => {
  return Math.min(currentDelay * 2, MAX_RECONNECT_DELAY_MS);
};

export const useLiveTradeStream = (): LiveTradeStreamState => {
  const [trades, setTrades] = useState<NormalizedTrade[]>([]);
  const [statuses, setStatuses] = useState<ExchangeStatusMap>({
    kraken: "connecting",
    coinbase: "connecting",
    bitstamp: "connecting",
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const cleanups: Array<() => void> = [];

    for (const adapter of exchangeAdapters) {
      let socket: WebSocket | null = null;
      let retryTimer: number | null = null;
      let retryDelayMs = INITIAL_RECONNECT_DELAY_MS;
      let intentionallyClosed = false;

      const setStatus = (status: StreamConnectionState) => {
        setStatuses((prev) => ({
          ...prev,
          [adapter.id]: status,
        }));
      };

      const clearRetryTimer = () => {
        if (retryTimer !== null) {
          window.clearTimeout(retryTimer);
          retryTimer = null;
        }
      };

      const connect = () => {
        if (!isMountedRef.current || intentionallyClosed) return;

        clearRetryTimer();
        setStatus("connecting");
        socket = new WebSocket(adapter.url);

        socket.onopen = () => {
          retryDelayMs = INITIAL_RECONNECT_DELAY_MS;
          setStatus("open");
          socket?.send(JSON.stringify(adapter.subscribe()));
        };

        socket.onmessage = (event) => {
          if (!isMountedRef.current) return;

          let parsed: unknown;
          try {
            parsed = JSON.parse(event.data as string);
          } catch {
            return;
          }

          const nextTrades = adapter.parseTrades(parsed);
          if (nextTrades.length === 0) return;

          setTrades((prev) => {
            const merged = [...nextTrades.reverse(), ...prev];
            const seen = new Set<string>();
            const deduped: NormalizedTrade[] = [];

            for (const trade of merged) {
              if (seen.has(trade.tradeId)) continue;
              seen.add(trade.tradeId);
              deduped.push(trade);
              if (deduped.length >= LIVE_EVENTS_MAX_ROWS) break;
            }

            return deduped;
          });
        };

        socket.onerror = () => {
          setStatus("error");
        };

        socket.onclose = () => {
          socket = null;

          if (!isMountedRef.current || intentionallyClosed) {
            setStatus("closed");
            return;
          }

          setStatus("closed");
          retryTimer = window.setTimeout(() => {
            retryDelayMs = nextDelay(retryDelayMs);
            connect();
          }, retryDelayMs);
        };
      };

      connect();

      cleanups.push(() => {
        intentionallyClosed = true;
        clearRetryTimer();

        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.close(1000, "LiveEvents unmounted");
        } else if (socket) {
          socket.close();
        }

        socket = null;
      });
    }

    return () => {
      isMountedRef.current = false;
      for (const cleanup of cleanups) cleanup();
    };
  }, []);

  const stableTrades = useMemo(() => trades, [trades]);

  return {
    trades: stableTrades,
    statuses,
  };
};