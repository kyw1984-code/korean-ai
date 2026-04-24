-- KoreanTalk: device_usage table for API rate limiting
-- Run this once in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS device_usage (
  device_id TEXT NOT NULL,
  date      DATE NOT NULL,
  token_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (device_id, date)
);

-- Auto-delete rows older than 90 days (nightly cron in Supabase)
-- Enable pg_cron extension first: Database → Extensions → pg_cron
-- SELECT cron.schedule('delete-old-usage', '0 3 * * *',
--   $$DELETE FROM device_usage WHERE date < CURRENT_DATE - INTERVAL '90 days'$$);
