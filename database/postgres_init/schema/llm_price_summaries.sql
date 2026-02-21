-- Schema for LLM price summaries
CREATE TABLE IF NOT EXISTS llm_price_summaries (
  summary_id BIGSERIAL PRIMARY KEY,
  exchange   TEXT NOT NULL,
  symbol     TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  summary TEXT NOT NULL,
  summary_type price_summary_type NOT NULL, -- daily | hourly | custom
  llm_used TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  FOREIGN KEY (exchange, symbol)
    REFERENCES instrument (exchange, symbol)
    ON DELETE RESTRICT
);

create index if not exists idx_llm_price_summaries_instrument_timestamp
  on llm_price_summaries (exchange, symbol, timestamp);