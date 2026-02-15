-- Migration: add live_tracking_consent to participants
-- Date: 2026-02-15

BEGIN;

-- Add column if not exists, default to false (opt-in required)
ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS live_tracking_consent boolean NOT NULL DEFAULT false;

COMMIT;
