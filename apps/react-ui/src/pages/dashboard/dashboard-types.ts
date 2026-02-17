import { type KrakenEvent } from "@blc/contracts";
export type KrakenTickerEvent = Extract<KrakenEvent, { channel: "ticker" }>;
