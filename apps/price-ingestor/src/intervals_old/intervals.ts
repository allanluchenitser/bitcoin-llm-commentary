// @ts-nocheck
import type { RedisClient } from "@blc/redis-client";
import type { LatestBySymbol } from "../ws/wsBusinessHandlers.js";
import { publishTicker, storeLatestSnapshot } from "../redis/publisher.js";
import { color } from "@blc/color-logger";
import { type KrakenTickerData, type KrakenTickerEvent } from "@blc/contracts";

// Your existing per-second console summarizer stays as-is
export type FrequencyMetrics = {
  updatesPerSec: number;
  snapshotsPerSec: number;
  unknownPerSec: number;
}

// just for logging
export function setTickerMetricsInterval(
  latestBySymbol: LatestBySymbol,
  metrics: FrequencyMetrics,
) {
  const updateInterval = setInterval(() => {
    const parts: string[] = [];

    // each ticker gets a line
    for (const [symbol, v] of latestBySymbol.entries()) {
      const t = v.ticker;
      parts.push(
        `${symbol} (${v.lastType}) last=${t.last ?? "?"} bid=${t.bid ?? "?"} ask=${t.ask ?? "?"}`
      );
    }

    color.info(
      `[ticker] update=${metrics.updatesPerSec}/s snapshot=${metrics.snapshotsPerSec}/s unknown=${metrics.unknownPerSec}/s`
    );

    if (parts.length > 0) console.log(parts.join("\n") + "\n");

    metrics.updatesPerSec = 0;
    metrics.snapshotsPerSec = 0;
    metrics.unknownPerSec = 0;
  }, 1000);

  return updateInterval;
}

let snapshotFlushInFlight = false;

export function setSnapshotPublishingInterval(
  redis: RedisClient,
  latestBySymbol: LatestBySymbol,
) {
  // Coalesce snapshots to Redis once per second (store + publish)
  const snapshotInterval = setInterval(async () => {
    if (snapshotFlushInFlight) return;
    snapshotFlushInFlight = true;

    try {
      const ts = Date.now();

      for (const [symbol, v] of latestBySymbol.entries()) {
        const snapshotEvent: KrakenTickerEvent = {
          source: "kraken" as const,
          symbol,
          type: "snapshot" as const,
          ts_ms: ts,
          data: v.ticker
        };

        try {
          await storeLatestSnapshot(redis, symbol, snapshotEvent, { ttlSeconds: 120 });
          await publishTicker(snapshotEvent, redis);
        } catch (err) {
          color.error(`[redis] snapshot store/publish failed for ${symbol}: ${String(err)}`);
        }
      }
    } finally {
      snapshotFlushInFlight = false;
    }
  }, 1000);

  return snapshotInterval;
}
