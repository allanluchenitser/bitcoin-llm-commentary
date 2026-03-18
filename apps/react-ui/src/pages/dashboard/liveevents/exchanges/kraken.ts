import {
  KRAKEN_SYMBOL,
  LIVE_EVENTS_SYMBOL_CANONICAL,
} from "../live-events-config";
import {
  toFiniteNumber,
  toIsoTimestamp,
  withNotional,
} from "../normalize";
import { type ExchangeAdapter, type NormalizedTrade, type TradeSide } from "../types";

const KRAKEN_WS_URL = "wss://ws.kraken.com";

const parseKrakenSide = (value: unknown): TradeSide => {
  if (value === "b") return "buy";
  if (value === "s") return "sell";
  return "unknown";
};

export const krakenAdapter: ExchangeAdapter = {
  id: "kraken",
  url: KRAKEN_WS_URL,
  subscribe: () => ({
    event: "subscribe",
    pair: [KRAKEN_SYMBOL],
    subscription: { name: "trade" },
  }),
  parseTrades: (rawMessage: unknown): NormalizedTrade[] => {
    if (!Array.isArray(rawMessage) || rawMessage.length < 4) return [];

    const tradeType = rawMessage[2];
    const pair = rawMessage[3];
    const payload = rawMessage[1];

    if (tradeType !== "trade" || pair !== KRAKEN_SYMBOL || !Array.isArray(payload)) return [];

    const output: NormalizedTrade[] = [];

    for (const row of payload) {
      if (!Array.isArray(row) || row.length < 4) continue;

      const price = toFiniteNumber(row[0]);
      const size = toFiniteNumber(row[1]);
      const tsIso = toIsoTimestamp(row[2]);
      const side = parseKrakenSide(row[3]);

      if (price === null || size === null || tsIso === null) continue;

      output.push(withNotional({
        exchange: "kraken",
        symbol: LIVE_EVENTS_SYMBOL_CANONICAL,
        price,
        size,
        side,
        tsIso,
        tradeId: `kraken-${tsIso}-${price}-${size}`,
      }));
    }

    return output;
  },
};