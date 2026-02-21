-- Schema for OHLCV pricing data
CREATE TABLE IF NOT EXISTS instrument (
  exchange    TEXT NOT NULL,      -- 'kraken'
  symbol      TEXT NOT NULL,      -- exchange-formatted, e.g. 'XBT/USD'
  base_asset  TEXT,
  quote_asset TEXT,
  PRIMARY KEY (exchange, symbol)
);


CREATE TABLE IF NOT EXISTS ohlcv (
  exchange   TEXT NOT NULL,
  symbol     TEXT NOT NULL,       -- same format as instrument.symbol
  ts         TIMESTAMPTZ NOT NULL,
  open       NUMERIC(20,10) NOT NULL,
  high       NUMERIC(20,10) NOT NULL,
  low        NUMERIC(20,10) NOT NULL,
  close      NUMERIC(20,10) NOT NULL,
  volume     NUMERIC(20,10) NOT NULL,
  interval_s INTEGER NOT NULL,

  PRIMARY KEY (exchange, symbol, ts, interval_s),
  FOREIGN KEY (exchange, symbol)
    REFERENCES instrument (exchange, symbol)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_ohlcv_instrument_interval_ts
  ON ohlcv (exchange, symbol, interval_s, ts DESC);





