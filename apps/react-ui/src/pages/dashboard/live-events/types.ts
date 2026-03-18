export type ExchangeId = "kraken" | "coinbase" | "bitstamp";
export type TradeSide = "buy" | "sell" | "unknown";

export type NormalizedTrade = {
  exchange: ExchangeId;
  symbol: string;
  price: number;
  size: number;
  side: TradeSide;
  tsIso: string;
  tradeId: string;
  notionalUsd: number;
};

export type StreamConnectionState = "connecting" | "open" | "closed" | "error";

export type ExchangeAdapter = {
  id: ExchangeId;
  url: string;
  subscribe: () => unknown;
  parseTrades: (rawMessage: unknown) => NormalizedTrade[];
};