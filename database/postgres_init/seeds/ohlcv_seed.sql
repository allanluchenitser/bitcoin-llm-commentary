-- Seed data for OHLCV table
INSERT INTO ohlcv (instrument_id, timestamp, open, high, low, close, volume)
VALUES
  (1, '2026-02-18T00:00:00Z', 43000.00, 44000.00, 42000.00, 43500.00, 120.5),
  (1, '2026-02-19T00:00:00Z', 43500.00, 44500.00, 43000.00, 44000.00, 150.3);