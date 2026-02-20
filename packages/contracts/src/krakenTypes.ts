export const CHANNEL_TICKER_UPDATE = "ticker:update";
export const CHANNEL_TICKER_SNAPSHOT = "ticker:snapshot";
export const CHANNEL_TICKER_GENERIC = "blc-ticker";

/* ------ Ticker Data Types ------ */

export interface KrakenTickerData {
  source: "kraken";

  // external api so who knows
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
  timestamp: string;
  volume?: number;
  vwap?: number;
};

export interface KrakenTradeData {
  source: "kraken";
  symbol: string;
  side: string;
  qty: number;
  price: number;
  ord_type: "market" | "limit";
  trade_id: number;
  timestamp: string;
}


/* ------ Ticker Event Types ------ */

export type KrakenEvent =
  | {
      source: "kraken";
      channel: "ticker";
      type: "snapshot" | "update";
      data: KrakenTickerData[];
    }
  | {
      source: "kraken";
      channel: "trade";
      type: "snapshot" | "update";
      data: KrakenTradeData[];
    }
  | {
      source: "kraken";
      channel: "heartbeat";
    };

// export const isKrakenDataEvent = (kEvent: any) => {
//   return ('data' in kEvent && Array.isArray(kEvent.data) && kEvent.data.length > 0)
// }

