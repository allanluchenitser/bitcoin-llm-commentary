import WebSocket from "ws";
import { color } from "@blc/color-logger";
import { type RedisClient } from "@blc/redis-client";
import { type KrakenTickerData, type KrakenTickerEvent } from "@blc/contracts";
import { type FrequencyMetrics } from "../intervals/intervals.js";
import {
  SubRequest,
  isSubAcknowledgement,
  isTickerResponse
} from "../types-and-guards.js";

import { publishTicker } from "../redis/publisher.js";
import helper from "./wsHelpers.js";

export type LatestBySymbol = Map<
  string,
  { ticker: KrakenTickerData; lastType: "snapshot" | "update" }
>;

type WsBusinessHandlerParams = {
  ws: WebSocket;
  latestBySymbol: LatestBySymbol;
  frequencyMetrics: FrequencyMetrics;
  redis: RedisClient;
};

export function attachWsBusinessHandlers({
  ws,
  redis,
  latestBySymbol,
  frequencyMetrics,
}: WsBusinessHandlerParams): void {
  const ms = process.env.INGESTOR_PUBLISH_INTERVAL_MS;
  const INGESTOR_PUBLISH_INTERVAL_MS = ms ? Number(ms) : 200;

  console.log(`[ws][kraken] publish interval set to ${INGESTOR_PUBLISH_INTERVAL_MS}ms`);

  const pendingBySymbol = new Map<
    string,
    { ticker: KrakenTickerData; lastType: "snapshot" | "update" }
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
        const tickerEvent: KrakenTickerEvent = {
          source: "kraken" as const,
          symbol: ticker.symbol,
          type: lastType,
          ts_ms: Date.now(),
          data: ticker
        };

        try {
          await publishTicker(tickerEvent, redis);
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

    if (isTickerResponse(json)) {
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