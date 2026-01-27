-- Add push notification history and targeted messaging support
-- Run this after add-enhanced-features.sql

-- Table to track all push notifications sent
CREATE TABLE IF NOT EXISTS push_notifications_history (
  id BIGSERIAL PRIMARY KEY,
  participant_id UUID REFERENCES participants(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  event_type TEXT NOT NULL, -- e.g., 'zone_opened', 'zone_closed', 'event_marker', 'achievement', 'custom'
  event_data JSONB, -- Store event metadata
  target_type TEXT NOT NULL, -- 'broadcast', 'targeted', 'single'
  target_criteria JSONB, -- For targeted messages: {"zones": [...], "regions": [...], "user_ids": [...]}
  recipient_count INTEGER, -- Total recipients this was sent to
  success_count INTEGER DEFAULT 0, -- Number of successful deliveries
  failed_count INTEGER DEFAULT 0, -- Number of failed deliveries
  expired_count INTEGER DEFAULT 0, -- Number of expired subscriptions
  status TEXT DEFAULT 'pending', -- 'pending', 'sending', 'completed', 'failed'
  sent_by UUID REFERENCES auth.users(id), -- Admin user who sent it (null for automatic events)
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to track individual push delivery status
CREATE TABLE IF NOT EXISTS push_delivery_log (
  id BIGSERIAL PRIMARY KEY,
  notification_history_id BIGINT REFERENCES push_notifications_history(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  subscription_endpoint TEXT,
  delivery_status TEXT, -- 'pending', 'sent', 'failed', 'expired'
  error_message TEXT,
  status_code INTEGER,
  delivery_attempt INTEGER DEFAULT 1,
  first_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for managing targeted recipient groups
CREATE TABLE IF NOT EXISTS push_recipient_groups (
  id BIGSERIAL PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL, -- {"zones": [...], "regions": [...], "has_badge": "...", "status": "..."}
  participant_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(created_by, name)
);

-- Table for scheduled/recurring push messages
CREATE TABLE IF NOT EXISTS push_message_templates (
  id BIGSERIAL PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  event_type TEXT,
  target_group_id BIGINT REFERENCES push_recipient_groups(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_push_history_participant ON push_notifications_history(participant_id);
CREATE INDEX IF NOT EXISTS idx_push_history_event_type ON push_notifications_history(event_type);
CREATE INDEX IF NOT EXISTS idx_push_history_sent_at ON push_notifications_history(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_history_status ON push_notifications_history(status);
CREATE INDEX IF NOT EXISTS idx_push_history_sent_by ON push_notifications_history(sent_by);

CREATE INDEX IF NOT EXISTS idx_push_delivery_notification ON push_delivery_log(notification_history_id);
CREATE INDEX IF NOT EXISTS idx_push_delivery_participant ON push_delivery_log(participant_id);
CREATE INDEX IF NOT EXISTS idx_push_delivery_status ON push_delivery_log(delivery_status);

CREATE INDEX IF NOT EXISTS idx_recipient_groups_active ON push_recipient_groups(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_message_templates_active ON push_message_templates(is_active) WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE push_notifications_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_recipient_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_message_templates ENABLE ROW LEVEL SECURITY;

-- Policies for push_notifications_history
CREATE POLICY "Participants view own notification history" ON push_notifications_history
  FOR SELECT USING (
    participant_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "Admins insert notifications" ON push_notifications_history
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

-- Policies for push_delivery_log
CREATE POLICY "Participants view own delivery logs" ON push_delivery_log
  FOR SELECT USING (
    participant_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "Admins insert delivery logs" ON push_delivery_log
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

-- Policies for recipient groups (admins only)
CREATE POLICY "Admins manage recipient groups" ON push_recipient_groups
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

-- Policies for message templates (admins only)
CREATE POLICY "Admins manage message templates" ON push_message_templates
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

-- Comments
COMMENT ON TABLE push_notifications_history IS 'Complete history of all push notifications sent';
COMMENT ON TABLE push_delivery_log IS 'Per-recipient delivery status for push notifications';
COMMENT ON TABLE push_recipient_groups IS 'Pre-defined groups of recipients for targeted messaging';
COMMENT ON TABLE push_message_templates IS 'Templates for recurring or pre-made push messages';

COMMENT ON COLUMN push_notifications_history.event_type IS 'Type of event that triggered the notification: zone_opened, zone_closed, event_marker, achievement, custom, etc.';
COMMENT ON COLUMN push_notifications_history.target_type IS 'Broadcast to all, targeted to specific criteria, or single recipient';
COMMENT ON COLUMN push_notifications_history.target_criteria IS 'JSON criteria for targeted messages: {"zones": ["zone1", "zone2"], "regions": ["north"], "user_ids": ["uuid1", "uuid2"]}';
COMMENT ON COLUMN push_recipient_groups.criteria IS 'JSON criteria for filtering recipients: {"zones": [...], "has_badge": "elite", "status": "active", "checked_in_after": "2026-01-01"}';
