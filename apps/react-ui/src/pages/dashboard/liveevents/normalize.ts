import { BIG_TRADE_NOTIONAL_USD } from "./live-events-config";
import { type NormalizedTrade } from "./types";

export const toFiniteNumber = (value: unknown): number | null => {
  const num = typeof value === "number"
    ? value
    : typeof value === "string"
      ? Number(value)
      : NaN;

  return Number.isFinite(num) ? num : null;
};

export const toIsoTimestamp = (value: unknown): string | null => {
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();

    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) {
      const millis = asNumber > 1e12 ? asNumber : asNumber * 1000;
      const numericDate = new Date(millis);
      return Number.isNaN(numericDate.getTime()) ? null : numericDate.toISOString();
    }
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value > 1e12 ? value : value * 1000;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  return null;
};

export const withNotional = (trade: Omit<NormalizedTrade, "notionalUsd">): NormalizedTrade => {
  return {
    ...trade,
    notionalUsd: trade.price * trade.size,
  };
};

export const isBigTrade = (trade: NormalizedTrade): boolean => {
  return trade.notionalUsd >= BIG_TRADE_NOTIONAL_USD;
};