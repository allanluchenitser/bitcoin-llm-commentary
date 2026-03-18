import { bitstampAdapter } from "./bitstamp";
import { coinbaseAdapter } from "./coinbase";
import { krakenAdapter } from "./kraken";

export const exchangeAdapters = [
  krakenAdapter,
  coinbaseAdapter,
  bitstampAdapter,
];