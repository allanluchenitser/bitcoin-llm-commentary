export const CHANNEL_TICKER_UPDATE = "ticker:update";
export const CHANNEL_TICKER_SNAPSHOT = "ticker:snapshot";

// strip whitespace
export function latestKey(symbol: string) {
  return `ticker:latest:${symbol.replace(/\s+/g, "")}`;
}