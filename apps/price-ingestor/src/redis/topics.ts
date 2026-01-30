export const TOPIC_TICKER_UPDATE = "ticker:update";
export const TOPIC_TICKER_SNAPSHOT = "ticker:snapshot";

export function latestKey(symbol: string) {
  return `ticker:latest:${symbol.replace(/\s+/g, "")}`;
}