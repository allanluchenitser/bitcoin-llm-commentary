import { type OHLCV, type KrakenTradeData } from '@blc/contracts';

export function calculateOHLCV(trades: KrakenTradeData[], intervalMs: number): OHLCV | null {
  if (trades.length === 0) return null;

  const interval = intervalMs;
  const time = Math.floor(Math.ceil(Date.now() / interval) * interval);

  const open = trades[0].price;
  const close = trades[trades.length - 1].price;
  const high = Math.max(...trades.map((trade) => trade.price));
  const low = Math.min(...trades.map((trade) => trade.price));

  const volume = trades.reduce((sum, trade) => sum + trade.qty, 0);

  return {
    interval,
    time,
    open,
    high,
    low,
    close,
    volume,
  };
}