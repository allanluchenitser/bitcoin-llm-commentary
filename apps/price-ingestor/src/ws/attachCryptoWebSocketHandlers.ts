import WebSocket from "ws";
import { color } from "@blc/color-logger";
import { type RedisClient } from "@blc/redis-client";
import { type FrequencyMetrics } from "../intervals/intervals.js";
import {
  SubRequest,
  isSubAcknowledgement,
  isUpdateResponse
} from "../types-and-guards.js";

import { publishUpdate } from "../redis/publisher.js";

export type TickerLike = {
  ask?: number;
  ask_qty?: number;
  bid?: number;
  bid_qty?: number;
  change?: number;
  change_pct?: number;
  high?: number;
  last?: number;
  low?: number;
  symbol: string;
  volume?: number;
  vwap?: number;
};

export type LatestBySymbol = Map<
  string,
  { ticker: TickerLike; lastType: "snapshot" | "update" }
>;

type AttachCryptoWebSocketHandlersParams = {
  ws: WebSocket;
  fatal: (err: Error) => void;
  latestBySymbol: LatestBySymbol;
  frequencyMetrics: FrequencyMetrics;
  redis: RedisClient;
};

function shouldFatalWsError(err: unknown): boolean {
  const code = (err as { code?: string }).code;

  // “Usually won’t fix itself without a deploy/config change”
  return (
    code === "ERR_INVALID_URL" ||
    code === "ERR_TLS_CERT_ALTNAME_INVALID" ||
    code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
    code === "CERT_HAS_EXPIRED"
  );
}

export function attachCryptoWebSocketHandlers({
  ws,
  fatal,
  latestBySymbol,
  frequencyMetrics,
  redis
}: AttachCryptoWebSocketHandlersParams): void {
  function onOpen() {
    const msg: SubRequest = {
      method: "subscribe",
      params: {
        channel: "ticker",
        symbol: ["BTC/USD", "ETH/USD"],
        event_trigger: "bbo"
      }
    };

    ws.send(JSON.stringify(msg));
    console.log("Opened websocket to Kraken ticker. Subscription request sent.");
  }

  async function onMessage(kmsg: WebSocket.RawData) {
    let json: unknown;
    try {
      json = JSON.parse(kmsg.toString());
    } catch {
      console.error("Failed to parse message:", kmsg.toString());
      return;
    }

    if (isSubAcknowledgement(json)) return;

    if (isUpdateResponse(json)) {
      const ticker = json.data[0] as TickerLike;

      if (json.type === "snapshot") {
        frequencyMetrics.snapshotsPerSec += 1;
      } else if (json.type === "update") {
        frequencyMetrics.updatesPerSec += 1;
      } else {
        frequencyMetrics.unknownPerSec += 1;
      }

      latestBySymbol.set(ticker.symbol, { ticker, lastType: json.type });

      const updateEvent = {
        source: "kraken" as const,
        symbol: ticker.symbol,
        type: "update" as const,
        ts_ms: Date.now(),
        data: ticker as unknown as Record<string, unknown>
      };

      try {
        await publishUpdate(redis, updateEvent);
      } catch (err) {
        color.error(
          `[redis] update publish failed for ${ticker.symbol}: ${String(err)}`
        );
      }

      return;
    }

    frequencyMetrics.unknownPerSec += 1;
  }

  function onError(err: Error) {
      if (shouldFatalWsError(err.cause)) {
        fatal(err);
      }
      else {
        console.error(`[ws][kraken] ${String(err)}`);
      }
  }

  ws.on("message", onMessage);
  ws.on("error", onError);
  ws.on("open", onOpen);
}