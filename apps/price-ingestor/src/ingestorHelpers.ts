import { type OHLCV, type KrakenTradeData } from '@blc/contracts';

export function calculateOHLCV(trades: KrakenTradeData[], intervalMs: number): OHLCV | null {
  if (trades.length === 0) return null;
  const exchange = trades[0].exchange;
  const symbol = trades[0].symbol;
  const ts = new Date(trades[0].timestamp).toISOString();

  const open = trades[0].price;
  const high = Math.max(...trades.map((trade) => trade.price));
  const low = Math.min(...trades.map((trade) => trade.price));
  const close = trades[trades.length - 1].price;

  const volume = trades.reduce((sum, trade) => sum + trade.qty, 0);

  return {
    exchange, symbol, ts, open, high, low,
    close, volume
  };
}