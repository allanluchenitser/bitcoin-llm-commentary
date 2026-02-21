-- Seed data for LLM price summaries

INSERT INTO llm_price_summaries (
  instrument_id,
  timestamp,
  summary,
  summary_type,
  llm_used,
  created_at
)
VALUES
  (1, '2026-02-18T00:00:00Z', 'Bitcoin saw a volatile day, reaching a high of $44,000 before closing at $43,500.', 'daily', 'gpt-4', now()),
  (1, '2026-02-19T00:00:00Z', 'Bitcoin continued its upward trend, closing at $44,000 after testing resistance at $44,500.', 'daily', 'gpt-4', now());