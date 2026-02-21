-- Schema for LLM price summaries
CREATE TABLE IF NOT EXISTS llm_price_summaries (
  summary_id BIGSERIAL PRIMARY KEY,
  instrument_id BIGINT NOT NULL REFERENCES instrument(instrument_id),
  timestamp TIMESTAMPTZ NOT NULL,
  summary TEXT NOT NULL,
  summary_type price_summary_type NOT NULL, -- daily | hourly | custom
  llm_used TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_llm_summaries_instrument_timestamp
  ON llm_price_summaries (instrument_id, timestamp DESC);