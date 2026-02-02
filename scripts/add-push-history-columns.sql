-- Add missing columns to push_notifications_history table
-- This migration adds columns needed for tracking push notification delivery stats

ALTER TABLE push_notifications_history 
  ADD COLUMN IF NOT EXISTS expired_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_type TEXT,
  ADD COLUMN IF NOT EXISTS target_criteria JSONB;

-- Add comment to explain the columns
COMMENT ON COLUMN push_notifications_history.expired_count IS 'Number of push subscriptions that were expired/invalid';
COMMENT ON COLUMN push_notifications_history.target_type IS 'Type of targeting: broadcast, targeted, template, etc.';
COMMENT ON COLUMN push_notifications_history.target_criteria IS 'Criteria used for targeted messages (zones, user_ids, etc.)';
