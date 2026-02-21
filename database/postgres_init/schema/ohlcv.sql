-- Schema for OHLCV pricing data
CREATE TABLE IF NOT EXISTS instrument (
  instrument_id BIGSERIAL PRIMARY KEY,
  exchange TEXT NOT NULL,                 -- e.g. 'kraken'
  symbol TEXT NOT NULL,                   -- e.g. 'BTC/USD' (as the exchange formats it)
  base_asset TEXT,                        -- optional (e.g. 'BTC')
  quote_asset TEXT,                       -- optional (e.g. 'USD')
  UNIQUE (exchange, symbol)
);


CREATE TABLE IF NOT EXISTS ohlcv (
  ohlcv_id BIGSERIAL PRIMARY KEY,
  instrument_id BIGINT NOT NULL REFERENCES instrument(instrument_id),
  interval_seconds INTEGER NOT NULL,      -- e.g. 1, 60, 300
  timestamp TIMESTAMPTZ NOT NULL,         -- bucket start time (UTC)
  open NUMERIC(20, 10) NOT NULL,
  high NUMERIC(20, 10) NOT NULL,
  low NUMERIC(20, 10) NOT NULL,
  close NUMERIC(20, 10) NOT NULL,
  volume NUMERIC(28, 12) NOT NULL,
  UNIQUE (instrument_id, interval_seconds, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_ohlcv_instrument_interval_ts
  ON ohlcv (instrument_id, interval_seconds, timestamp DESC);

