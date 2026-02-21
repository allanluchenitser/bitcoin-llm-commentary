-- Seed data for OHLCV table

-- Insert instrument (if not already present)
INSERT INTO instrument (exchange, symbol, base_asset, quote_asset)
VALUES ('kraken', 'BTC/USD', 'BTC', 'USD')
ON CONFLICT (exchange, symbol) DO NOTHING;

-- Insert OHLCV data
INSERT INTO ohlcv (instrument_id, time_size, time, open, high, low, close, volume)
VALUES
  (1, 60, '2026-02-18T00:00:00Z', 43000.00, 44000.00, 42000.00, 43500.00, 120.5),
  (1, 60, '2026-02-19T00:00:00Z', 43500.00, 44500.00, 43000.00, 44000.00, 150.3);