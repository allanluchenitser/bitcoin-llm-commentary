import {
  COINBASE_SYMBOL,
  LIVE_EVENTS_SYMBOL_CANONICAL,
} from "../live-events-config";
import {
  toFiniteNumber,
  toIsoTimestamp,
  withNotional,
} from "../normalize";
import { type ExchangeAdapter, type TradeSide } from "../types";

const COINBASE_WS_URL = "wss://ws-feed.exchange.coinbase.com";

type CoinbaseMatchMessage = {
  type?: string;
  trade_id?: number;
  side?: string;
  product_id?: string;
  price?: string;
  size?: string;
  time?: string;
};

const parseCoinbaseSide = (value: unknown): TradeSide => {
  if (value === "buy") return "buy";
  if (value === "sell") return "sell";
  return "unknown";
};

export const coinbaseAdapter: ExchangeAdapter = {
  id: "coinbase",
  url: COINBASE_WS_URL,
  subscribe: () => ({
    type: "subscribe",
    product_ids: [COINBASE_SYMBOL],
    channels: ["matches"],
  }),
  parseTrades: (rawMessage: unknown) => {
    const msg = rawMessage as CoinbaseMatchMessage;

    if (!msg || msg.type !== "match" || msg.product_id !== COINBASE_SYMBOL) return [];

    const price = toFiniteNumber(msg.price);
    const size = toFiniteNumber(msg.size);
    const tsIso = toIsoTimestamp(msg.time);

    if (price === null || size === null || tsIso === null) return [];

    return [withNotional({
      exchange: "coinbase",
      symbol: LIVE_EVENTS_SYMBOL_CANONICAL,
      price,
      size,
      side: parseCoinbaseSide(msg.side),
      tsIso,
      tradeId: `coinbase-${msg.trade_id ?? `${tsIso}-${price}-${size}`}`,
    })];
  },
};