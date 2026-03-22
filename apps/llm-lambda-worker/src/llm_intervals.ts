import {
  type OHLCV,
} from "@blc/contracts";

type DetectSpikeOptions = {
  priceSpikeThreshold: number; // e.g., 0.05 for 5% price change
  volumeSpikeMultiplier: number; // e.g., 2 for volume being 2x the average
};

export function detectSpike(
  candles: OHLCV[],
  { priceSpikeThreshold, volumeSpikeMultiplier }: DetectSpikeOptions
): boolean
{
  if (candles.length === 0) return false;
  const first = candles[0];
  const last = candles[candles.length - 1];
  const priceChange = Math.abs(last.close - first.open) / first.open;
  const avgVolume = candles.reduce((sum, c) => sum + c.volume, 0) / candles.length;

  const priceSpike = priceChange > priceSpikeThreshold;
  const volumeSpike = last.volume > avgVolume * volumeSpikeMultiplier;

  console.log({
    detectSpike: {
      candles: candles.length,
      priceSpikeThreshold,
      volumeSpikeMultiplier,

      firstPrice: first.open,
      lastPrice: last.close,
      firstVolume: first.volume,
      lastVolume: last.volume,
      priceChange,
      avgVolume,
      priceSpike,
      volumeSpike,
  }})

  return priceSpike || volumeSpike;
}
