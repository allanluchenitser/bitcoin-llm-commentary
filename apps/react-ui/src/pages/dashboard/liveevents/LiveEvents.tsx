import { type OHLCV } from '@blc/contracts';
import clsx from "clsx";
import { useState } from "react";
import {
  BIG_TRADE_NOTIONAL_USD,
} from "../liveevents/live-events-config";
import { isBigTrade } from "../liveevents/normalize";
import { useLiveTradeStream } from "../liveevents/useLiveTradeStream";
import { type ExchangeId, type LiveEventsMode } from "../liveevents/types";
import LiveEventsModeSelector from "./LiveEventsModeSelector";
import TradeBowlScene from "./TradeBowlScene";

type LiveEventsParams = {
  ohlcvData: OHLCV[],
  className?: string,
  style?: React.CSSProperties
}

const statusClass: Record<string, string> = {
  open: "bg-green-100 text-green-700",
  connecting: "bg-yellow-100 text-yellow-700",
  closed: "bg-gray-100 text-gray-700",
  error: "bg-red-100 text-red-700",
};

const exchangeLabel: Record<ExchangeId, string> = {
  kraken: "Kraken",
  coinbase: "Coinbase",
  bitstamp: "Bitstamp",
};

const notionalFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const numberFmt = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const sizeFmt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 5,
  maximumFractionDigits: 5,
});

const formatTradeTime = (tsIso: string) => {
  const date = new Date(tsIso);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date);
};

const sideClass = (side: string) => {
  if (side === "buy") return "text-green-600";
  if (side === "sell") return "text-red-600";
  return "text-gray-500";
};

const LiveEvents = ({ ohlcvData: _ohlcvData, className = "", style }: LiveEventsParams) => {
  const { trades, statuses } = useLiveTradeStream();
  const [mode, setMode] = useState<LiveEventsMode>("table");

  const exchangeStatuses = Object.entries(statuses) as Array<[ExchangeId, keyof typeof statusClass]>;

  return (
    <div className={clsx(
      "overflow-auto",
      "text-lg font-semibold border-y bg-white",
      className
    )} style={style}>
      <div className="sticky top-0 z-10 border-b bg-white px-2 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <LiveEventsModeSelector mode={mode} onChange={setMode} />
            <div className="text-xs font-semibold text-gray-700">
              Live Trades • Big Trade ≥ {notionalFmt.format(BIG_TRADE_NOTIONAL_USD)}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {exchangeStatuses.map(([exchange, status]) => (
              <span
                key={exchange}
                className={clsx(
                  "rounded-full px-2 py-0.5 text-[0.65rem] font-semibold",
                  statusClass[status]
                )}
              >
                {exchangeLabel[exchange]} {status}
              </span>
            ))}
          </div>
        </div>
      </div>

      {mode === "table"
        ? (
          trades.length === 0
          ? <div className="px-3 py-4 text-sm text-gray-500">Waiting for trade events...</div>
          : (
              <ul className="divide-y">
                {trades.map((trade) => {
                  const big = isBigTrade(trade);
                  return (
                    <li
                      key={trade.tradeId}
                      className={clsx(
                        "px-3 py-1.5 font-mono text-xs",
                        big ? "bg-amber-50" : "bg-white"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="w-20 shrink-0 text-gray-500">{exchangeLabel[trade.exchange]}</span>
                          <span className="w-20 shrink-0 text-gray-500">{trade.symbol}</span>
                          <span className={clsx("w-10 shrink-0 font-semibold uppercase", sideClass(trade.side))}>
                            {trade.side}
                          </span>
                          <span className="w-24 shrink-0 text-gray-900">${numberFmt.format(trade.price)}</span>
                          <span className="w-20 shrink-0 text-gray-700">{sizeFmt.format(trade.size)}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className={clsx("font-semibold", big ? "text-amber-700" : "text-gray-700")}>
                            {notionalFmt.format(trade.notionalUsd)}
                          </span>
                          <span className="w-28 text-right text-gray-500">{formatTradeTime(trade.tsIso)}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )
          )
        : (
          <div className="h-[calc(100%-49px)] min-h-[220px] bg-slate-50">
            <TradeBowlScene trades={trades} />
          </div>
        )
    }
    </div>
  )
}

export default LiveEvents