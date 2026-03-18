import {
  BITSTAMP_CHANNEL,
  LIVE_EVENTS_SYMBOL_CANONICAL,
} from "../live-events-config";
import {
  toFiniteNumber,
  toIsoTimestamp,
  withNotional,
} from "../normalize";
import { type ExchangeAdapter, type TradeSide } from "../types";

const BITSTAMP_WS_URL = "wss://ws.bitstamp.net";

type BitstampTradeMessage = {
  event?: string;
  channel?: string;
  data?: {
    id?: number | string;
    amount?: number | string;
    price?: number | string;
    timestamp?: number | string;
    microtimestamp?: number | string;
    type?: number | string;
  };
};

const parseBitstampSide = (value: unknown): TradeSide => {
  if (value === 0 || value === "0") return "buy";
  if (value === 1 || value === "1") return "sell";
  return "unknown";
};

export const bitstampAdapter: ExchangeAdapter = {
  id: "bitstamp",
  url: BITSTAMP_WS_URL,
  subscribe: () => ({
    event: "bts:subscribe",
    data: { channel: BITSTAMP_CHANNEL },
  }),
  parseTrades: (rawMessage: unknown) => {
    const msg = rawMessage as BitstampTradeMessage;

    if (!msg || msg.event !== "trade" || msg.channel !== BITSTAMP_CHANNEL || !msg.data) return [];

    const price = toFiniteNumber(msg.data.price);
    const size = toFiniteNumber(msg.data.amount);
    const tsIso = toIsoTimestamp(msg.data.microtimestamp ?? msg.data.timestamp);

    if (price === null || size === null || tsIso === null) return [];

    return [withNotional({
      exchange: "bitstamp",
      symbol: LIVE_EVENTS_SYMBOL_CANONICAL,
      price,
      size,
      side: parseBitstampSide(msg.data.type),
      tsIso,
      tradeId: `bitstamp-${msg.data.id ?? `${tsIso}-${price}-${size}`}`,
    })];
  },
};