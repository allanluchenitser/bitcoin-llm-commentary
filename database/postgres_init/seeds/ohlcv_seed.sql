-- Seed data for OHLCV table

-- Insert instrument (if not already present)
INSERT INTO instrument (exchange, symbol, base_asset, quote_asset)
VALUES
  ('kraken', 'BTC/USD', 'BTC', 'USD'),
  ('kraken', 'ETH/USD', 'ETH', 'USD');

ON CONFLICT (exchange, symbol) DO NOTHING;

INSERT INTO ohlcv (exchange, symbol, ts, open, high, low, close, volume, interval_s)
VALUES
  ('kraken', 'BTC/USD', '2026-02-18T00:00:00Z', 43000.00, 44000.00, 42000.00, 43500.00, 120.5, 60),
  ('kraken', 'BTC/USD', '2026-02-19T00:00:00Z', 43500.00, 44500.00, 43000.00, 44000.00, 150.3, 60);