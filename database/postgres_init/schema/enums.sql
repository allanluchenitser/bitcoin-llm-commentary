-- Shared enums or types
DO $$ BEGIN
  CREATE TYPE price_summary_type AS ENUM ('regular', 'spike', 'custom');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;