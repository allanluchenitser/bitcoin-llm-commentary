export interface SubRequest {
  method: "subscribe";
  params: {
    channel: string;
    symbol: string[];
    event_trigger?: string;
  };
}

export interface SubAcknowledgement {
  method: "subscribe";
  result: {
    channel: "ticker";
    symbol: string;
  };
}

export function isSubAcknowledgement(msg: any): msg is SubAcknowledgement {
  return msg
    && msg.method === "subscribe"
    && msg.result
    && msg.result.channel === "ticker"
    && typeof msg.result.symbol === "string";
}

interface TickerData {
  symbol: string;
  bid: number;
  bid_qty: number;
  ask: number;
  ask_qty: number;
  last: number;
  volume: number;
  vwap: number;
  low: number;
  high: number;
  change: number;
  change_pct: number;
}

export interface TickerResponse {
  channel: "ticker";
  type: "snapshot" | "update";
  data: TickerData[];
}

export function isTickerResponse(msg: any): msg is TickerResponse {
  return msg
    && msg.channel === "ticker"
    && (msg.type === "snapshot" || msg.type === "update")
    && Array.isArray(msg.data);
}

export type KrakenMessage =
  | SubAcknowledgement
  | TickerResponse

