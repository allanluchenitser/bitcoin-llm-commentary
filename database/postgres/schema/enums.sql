-- Shared enums or types
DO $$ BEGIN
  CREATE TYPE price_summary_type AS ENUM ('daily', 'hourly', 'custom');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;