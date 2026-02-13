export type KrakenSubscriptionRequest = {
  method: "subscribe",
  params: {
    channel: "ticker",
    symbol: string[],
    event_trigger: "bbo"
  }
};

