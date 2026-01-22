-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Kraken WS v2 Ticker schema
-- https://docs.kraken.com/api/docs/guides/global-intro
-- https://docs.kraken.com/api/docs/websocket-v2/ticker

-- BTC/USD, ETH/USD, etc.
CREATE TABLE IF NOT EXISTS instrument (
  instrument_id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE
);

-- Tickers com in two types: 'snapshot' and 'update'
DO $$ BEGIN
  CREATE TYPE kraken_ticker_msg_type AS ENUM ('snapshot', 'update');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Append-only ticker events (store both event_time and received_at)
CREATE TABLE IF NOT EXISTS ticker_event (
  ticker_event_id BIGSERIAL PRIMARY KEY,

  instrument_id BIGINT NOT NULL REFERENCES instrument(instrument_id),

  msg_type kraken_ticker_msg_type NOT NULL,

  -- Kraken-provided timestamp (e.g. '2026-01-22T04:15:06.958618Z')
  event_time TIMESTAMPTZ NOT NULL,

  -- when our ingestor received it
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ask           NUMERIC(20,10),
  ask_qty       NUMERIC(28,12),

  bid           NUMERIC(20,10),
  bid_qty       NUMERIC(28,12),

  change        NUMERIC(20,10),
  change_pct    NUMERIC(10,4),

  last_price    NUMERIC(20,10),
  low           NUMERIC(20,10),

  volume        NUMERIC(28,12),
  volume_usd    NUMERIC(28,12),

  vwap          NUMERIC(20,10),
  high_price    NUMERIC(20,10),

  raw JSONB     NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ticker_event_instrument_event_time
  ON ticker_event (instrument_id, event_time DESC);

CREATE INDEX IF NOT EXISTS idx_ticker_event_event_time
  ON ticker_event (event_time DESC);