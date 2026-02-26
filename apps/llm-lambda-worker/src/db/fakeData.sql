-- Insert 7 days of "believable enough" 1-minute BTC/USD candles into public.ohlcv_1m
-- Assumes instrument row already exists: ('kraken','BTC/USD')

-- Optional: make runs repeatable
-- SELECT setseed(0.42);

INSERT INTO public.ohlcv_1m (exchange, symbol, ts, open, high, low, close, volume)
SELECT
  'kraken'::text,
  'BTC/USD'::text,
  gs.ts,

  -- open = base price + gentle drift + a bit of noise
  ROUND((65000
    + (gs.i * 0.4)                          -- slow drift up over the week
    + (random() - 0.5) * 120                -- noise
  )::numeric, 2) AS open,

  -- high slightly above max(open, close)
  ROUND((
    GREATEST(
      (65000 + (gs.i * 0.4) + (random() - 0.5) * 120),
      (65000 + (gs.i * 0.4) + (random() - 0.5) * 120) + (random() - 0.5) * 80
    )
    + random() * 60
  )::numeric, 2) AS high,

  -- low slightly below min(open, close)
  ROUND((
    LEAST(
      (65000 + (gs.i * 0.4) + (random() - 0.5) * 120),
      (65000 + (gs.i * 0.4) + (random() - 0.5) * 120) + (random() - 0.5) * 80
    )
    - random() * 60
  )::numeric, 2) AS low,

  -- close = open + small move
  ROUND((
    (65000 + (gs.i * 0.4) + (random() - 0.5) * 120)
    + (random() - 0.5) * 80
  )::numeric, 2) AS close,

  -- volume: mostly small, sometimes spiky
  ROUND((
    0.2
    + random() * 1.5
    + CASE WHEN random() < 0.02 THEN random() * 8 ELSE 0 END
  )::numeric, 6) AS volume

FROM (
  SELECT
    date_trunc('minute', now()) - interval '7 days' + (n * interval '1 minute') AS ts,
    n AS i
  FROM generate_series(0, 7*24*60 - 1) AS n
) gs
ON CONFLICT (exchange, symbol, ts) DO NOTHING;