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
import helper from "./wsHelpers.js";

export type KrakenTickerLike = {
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
  { ticker: KrakenTickerLike; lastType: "snapshot" | "update" }
>;

type AttachCryptoWebSocketHandlersParams = {
  ws: WebSocket;
  latestBySymbol: LatestBySymbol;
  frequencyMetrics: FrequencyMetrics;
  redis: RedisClient;
};

export function attachCryptoWebSocketHandlers({
  ws,
  latestBySymbol,
  frequencyMetrics,
  redis
}: AttachCryptoWebSocketHandlersParams): void {
  const INGESTOR_PUBLISH_INTERVAL_MS = process.env.INGESTOR_PUBLISH_INTERVAL_MS
    ? parseInt(process.env.INGESTOR_PUBLISH_INTERVAL_MS)
    : 200;

  console.log(`[ws][kraken] publish interval set to ${INGESTOR_PUBLISH_INTERVAL_MS}ms`);

  const pendingBySymbol = new Map<
    string,
    { ticker: KrakenTickerLike; lastType: "snapshot" | "update" }
  >();

  let isPublishing = false;
  const publishTimer = setInterval(async () => {
    if (isPublishing) return;
    if (pendingBySymbol.size === 0) return;

    // "batch" means a single ticker but perhaps a value for each symbol
    const batch = Array.from(pendingBySymbol.values());
    pendingBySymbol.clear();

    isPublishing = true;
    try {
      for (const { ticker, lastType } of batch) {
        const updateEvent = {
          source: "kraken" as const,
          symbol: ticker.symbol,
          type: lastType,
          ts_ms: Date.now(),
          data: ticker
        };

        try {
          await publishUpdate(redis, updateEvent);
        } catch (err) {
          color.error(
            `[redis] update publish failed for ${ticker.symbol}: ${String(err)}`
          );
        }
      }
    } finally {
      isPublishing = false;
    }
  }, INGESTOR_PUBLISH_INTERVAL_MS);


  function onOpen() {
    const msg: SubRequest = {
      method: "subscribe",
      params: {
        channel: "ticker",
        symbol: ["BTC/USD"],
        event_trigger: "bbo"
      }
    };

    ws.send(JSON.stringify(msg));
    console.log("opened ws to Kraken. Subscription request sent.");
  }

  async function onMessage(kmsg: WebSocket.RawData) {
    let rawMessage: string | undefined;
    let json: unknown;

    try {
      rawMessage = helper.rawDataToUtf8(kmsg);
      json = JSON.parse(rawMessage);
    }
    catch(err) {
      console.error("message error", String(err), 'rawMessage:', rawMessage);
      return;
    }

    if (isSubAcknowledgement(json)) return;

    if (isUpdateResponse(json)) {
      const ticker = json.data[0] as KrakenTickerLike;

      if (json.type === "snapshot") {
        frequencyMetrics.snapshotsPerSec += 1;
      } else if (json.type === "update") {
        frequencyMetrics.updatesPerSec += 1;
      } else {
        frequencyMetrics.unknownPerSec += 1;
      }

      // from calling function
      latestBySymbol.set(ticker.symbol, { ticker, lastType: json.type });

      // local, the interval above publishes whatever happens to be here at the time
      pendingBySymbol.set(ticker.symbol, { ticker, lastType: json.type });

      return;
    }

    frequencyMetrics.unknownPerSec += 1;
  }

  ws.on("message", onMessage);
  ws.once("open", onOpen);
  ws.once("close", () => clearInterval(publishTimer));
}