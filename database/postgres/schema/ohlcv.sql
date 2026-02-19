-- Schema for OHLCV pricing data
CREATE TABLE IF NOT EXISTS ohlcv (
  ohlcv_id BIGSERIAL PRIMARY KEY,
  instrument_id BIGINT NOT NULL REFERENCES instrument(instrument_id),
  timestamp TIMESTAMPTZ NOT NULL,
  open NUMERIC(20, 10) NOT NULL,
  high NUMERIC(20, 10) NOT NULL,
  low NUMERIC(20, 10) NOT NULL,
  close NUMERIC(20, 10) NOT NULL,
  volume NUMERIC(28, 12) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ohlcv_instrument_timestamp
  ON ohlcv (instrument_id, timestamp DESC);