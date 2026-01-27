-- Deur Den Bocht - Complete Supabase Database Schema
-- Based on actual application usage and database.types.ts
-- Run this in Supabase SQL Editor

-- ============================================
-- CLEANUP (Run first if resetting)
-- ============================================

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS photo_likes CASCADE;
DROP TABLE IF EXISTS ride_story_likes CASCADE;
DROP TABLE IF EXISTS participant_photos CASCADE;
DROP TABLE IF EXISTS ride_stories CASCADE;
DROP TABLE IF EXISTS participant_achievements CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS emergency_contacts CASCADE;
DROP TABLE IF EXISTS emergency_sos CASCADE;
DROP TABLE IF EXISTS push_delivery_log CASCADE;
DROP TABLE IF EXISTS push_notifications_history CASCADE;
DROP TABLE IF EXISTS push_recipient_groups CASCADE;
DROP TABLE IF EXISTS push_message_templates CASCADE;
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS report_queue CASCADE;
DROP TABLE IF EXISTS report_history CASCADE;
DROP TABLE IF EXISTS scheduled_reports CASCADE;
DROP TABLE IF EXISTS rally_zone_checkins CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS increment_photo_likes CASCADE;
DROP FUNCTION IF EXISTS decrement_photo_likes CASCADE;
DROP FUNCTION IF EXISTS update_participant_shadow_scores CASCADE;
DROP FUNCTION IF EXISTS calculate_next_run_time CASCADE;
DROP FUNCTION IF EXISTS update_scheduled_report_after_run CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================
-- CORE TABLES
-- ============================================

-- Participants (riders)
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Personal info
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  bio TEXT,
  
  -- Motorcycle info
  motorcycle_brand TEXT NOT NULL,
  motorcycle_model TEXT NOT NULL,
  license_plate TEXT NOT NULL,
  
  -- Registration info
  formula TEXT NOT NULL CHECK (formula IN ('with_meals', 'breakfast_only')),
  ride_type TEXT NOT NULL CHECK (ride_type IN ('free', 'guided')),
  route_preference TEXT,
  
  -- Payment
  amount_paid INTEGER NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  stripe_payment_id TEXT,
  
  -- Event status
  qr_code TEXT NOT NULL UNIQUE,
  qr_code_image_url TEXT,
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  start_location JSONB, -- {lat, lng}
  
  -- Profile
  profile_photo_url TEXT,
  allow_location_sharing BOOLEAN DEFAULT FALSE,
  show_on_leaderboard BOOLEAN DEFAULT TRUE,
  
  -- Admin
  is_admin BOOLEAN DEFAULT FALSE,
  password_hash TEXT,
  allow_early_access BOOLEAN DEFAULT FALSE,
  
  -- Stats
  total_achievement_points INTEGER DEFAULT 0,
  status TEXT DEFAULT 'registered'
);

-- Rally zone check-ins (Concept B)
CREATE TABLE rally_zone_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  zone_id TEXT NOT NULL,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  location_lat DECIMAL(10, 7),
  location_lng DECIMAL(10, 7),
  odometer_reading INTEGER,
  notes TEXT,
  UNIQUE(participant_id, zone_id)
);

-- Documents (GPX, PDFs, etc)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('gpx', 'pdf', 'image', 'other')),
  category TEXT NOT NULL CHECK (category IN ('route', 'rally_book', 'map', 'instruction', 'other')),
  visible_to_public BOOLEAN DEFAULT FALSE
);

-- ============================================
-- ACHIEVEMENTS & GAMIFICATION
-- ============================================

-- Achievement definitions
CREATE TABLE achievements (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  criteria JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participant achievements
CREATE TABLE participant_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_id, achievement_id)
);

-- Certificates
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  pdf_url TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  downloaded_at TIMESTAMPTZ
);

-- ============================================
-- CONTENT & SOCIAL
-- ============================================

-- Ride stories (synced with Sanity CMS)
CREATE TABLE ride_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  sanity_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  is_approved BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  like_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0
);

-- Story likes
CREATE TABLE ride_story_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES ride_stories(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, participant_id)
);

-- Participant photos
CREATE TABLE participant_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  location_lat DECIMAL(10, 7),
  location_lng DECIMAL(10, 7),
  zone_id TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  is_approved BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  like_count INTEGER DEFAULT 0
);

-- Photo likes
CREATE TABLE photo_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES participant_photos(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, participant_id)
);

-- ============================================
-- SAFETY & EMERGENCY
-- ============================================

-- Emergency SOS
CREATE TABLE emergency_sos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  location_lat DECIMAL(10, 7) NOT NULL,
  location_lng DECIMAL(10, 7) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES participants(id)
);

-- Emergency contacts
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS & MESSAGING
-- ============================================

-- Push subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(endpoint)
);

-- Notification history
CREATE TABLE push_notifications_history (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  sent_by UUID REFERENCES participants(id),
  recipient_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  event_type TEXT,
  event_data JSONB,
  metadata JSONB
);

-- Delivery log
CREATE TABLE push_delivery_log (
  id SERIAL PRIMARY KEY,
  notification_history_id INTEGER REFERENCES push_notifications_history(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  subscription_endpoint TEXT,
  delivery_status TEXT,
  status_code INTEGER,
  error_message TEXT,
  first_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  last_attempt_at TIMESTAMPTZ,
  delivery_attempt INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipient groups
CREATE TABLE push_recipient_groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  participant_count INTEGER DEFAULT 0,
  criteria JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message templates
CREATE TABLE push_message_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  event_type TEXT NOT NULL,
  variables JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REPORTING & ANALYTICS
-- ============================================

-- Scheduled reports
CREATE TABLE scheduled_reports (
  id SERIAL PRIMARY KEY,
  report_type TEXT NOT NULL,
  frequency TEXT NOT NULL,
  email_list TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES participants(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report history
CREATE TABLE report_history (
  id SERIAL PRIMARY KEY,
  report_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  scheduled_report_id INTEGER REFERENCES scheduled_reports(id),
  participant_id UUID REFERENCES participants(id),
  generated_by UUID REFERENCES participants(id),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Report queue
CREATE TABLE report_queue (
  id SERIAL PRIMARY KEY,
  report_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  requested_by UUID NOT NULL REFERENCES participants(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  result_url TEXT,
  metadata JSONB
);

-- ============================================
-- STORAGE BUCKETS (created via Dashboard)
-- ============================================

-- participant-photos (public bucket)
-- qr-codes (public bucket)
-- fallback-photos (public bucket)  
-- reports (private bucket)

-- ============================================
-- INDEXES
-- ============================================

-- Participants
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_qr_code ON participants(qr_code);
CREATE INDEX IF NOT EXISTS idx_participants_payment_status ON participants(payment_status);
CREATE INDEX IF NOT EXISTS idx_participants_checked_in ON participants(checked_in);
CREATE INDEX IF NOT EXISTS idx_participants_is_admin ON participants(is_admin);

-- Zone check-ins
CREATE INDEX IF NOT EXISTS idx_zone_checkins_participant ON rally_zone_checkins(participant_id);
CREATE INDEX IF NOT EXISTS idx_zone_checkins_zone ON rally_zone_checkins(zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_checkins_time ON rally_zone_checkins(checked_in_at);

-- Achievements
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_participant ON participant_achievements(participant_id);
CREATE INDEX IF NOT EXISTS idx_achievements_earned_at ON participant_achievements(unlocked_at);

-- Stories
CREATE INDEX IF NOT EXISTS idx_ride_stories_participant ON ride_stories(participant_id);
CREATE INDEX IF NOT EXISTS idx_ride_stories_sanity ON ride_stories(sanity_id);
CREATE INDEX IF NOT EXISTS idx_ride_stories_slug ON ride_stories(slug);
CREATE INDEX IF NOT EXISTS idx_ride_stories_published ON ride_stories(published_at) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ride_stories_approved ON ride_stories(is_approved) WHERE is_approved = TRUE;

-- Photos
CREATE INDEX IF NOT EXISTS idx_photos_participant ON participant_photos(participant_id);
CREATE INDEX IF NOT EXISTS idx_photos_zone ON participant_photos(zone_id);
CREATE INDEX IF NOT EXISTS idx_photos_approved ON participant_photos(is_approved) WHERE is_approved = TRUE;
CREATE INDEX IF NOT EXISTS idx_photos_featured ON participant_photos(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_at ON participant_photos(uploaded_at);

-- Emergency
CREATE INDEX IF NOT EXISTS idx_emergency_sos_status ON emergency_sos(status);
CREATE INDEX IF NOT EXISTS idx_emergency_sos_created ON emergency_sos(created_at);
CREATE INDEX IF NOT EXISTS idx_emergency_sos_participant ON emergency_sos(participant_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_participant ON push_subscriptions(participant_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_push_delivery_notification ON push_delivery_log(notification_history_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rally_zone_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_sos ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications_history ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Public read public documents" ON documents FOR SELECT USING (visible_to_public = true);
CREATE POLICY "Public read achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Public read approved photos" ON participant_photos FOR SELECT USING (is_approved = true);
CREATE POLICY "Public read approved stories" ON ride_stories FOR SELECT USING (is_approved = true AND published_at IS NOT NULL);

-- User access to own data
CREATE POLICY "Users read own data" ON participants FOR SELECT USING (auth.uid()::text = id::text OR is_admin);
CREATE POLICY "Users manage own checkins" ON rally_zone_checkins FOR ALL USING (auth.uid()::text = participant_id::text);
CREATE POLICY "Users manage own photos" ON participant_photos FOR INSERT WITH CHECK (auth.uid()::text = participant_id::text);
CREATE POLICY "Users manage own stories" ON ride_stories FOR INSERT WITH CHECK (auth.uid()::text = participant_id::text);
CREATE POLICY "Users manage own emergency contacts" ON emergency_contacts FOR ALL USING (auth.uid()::text = participant_id::text);

-- Admin full access
CREATE POLICY "Admins full access" ON participants FOR ALL USING ((SELECT is_admin FROM participants WHERE id::text = auth.uid()::text));
CREATE POLICY "Admins full access to photos" ON participant_photos FOR ALL USING ((SELECT is_admin FROM participants WHERE id::text = auth.uid()::text));

-- ============================================
-- FUNCTIONS
-- ============================================

-- Increment/decrement photo likes
CREATE OR REPLACE FUNCTION increment_photo_likes(photo_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE participant_photos 
  SET like_count = like_count + 1 
  WHERE id = photo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_photo_likes(photo_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE participant_photos 
  SET like_count = GREATEST(0, like_count - 1)
  WHERE id = photo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update achievement points
CREATE OR REPLACE FUNCTION update_participant_shadow_scores(p_participant_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE participants 
  SET total_achievement_points = (
    SELECT COALESCE(SUM(a.points), 0)
    FROM participant_achievements pa
    JOIN achievements a ON pa.achievement_id = a.id
    WHERE pa.participant_id = p_participant_id
  )
  WHERE id = p_participant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate next report run time
CREATE OR REPLACE FUNCTION calculate_next_run_time(p_current_time TIMESTAMPTZ DEFAULT NOW(), p_frequency TEXT DEFAULT 'daily')
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN CASE p_frequency
    WHEN 'hourly' THEN p_current_time + INTERVAL '1 hour'
    WHEN 'daily' THEN p_current_time + INTERVAL '1 day'
    WHEN 'weekly' THEN p_current_time + INTERVAL '1 week'
    WHEN 'monthly' THEN p_current_time + INTERVAL '1 month'
    ELSE p_current_time + INTERVAL '1 day'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update scheduled report after run
CREATE OR REPLACE FUNCTION update_scheduled_report_after_run(p_scheduled_report_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE scheduled_reports
  SET 
    last_run_at = NOW(),
    next_run_at = calculate_next_run_time(NOW(), frequency)
  WHERE id = p_scheduled_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Insert default achievements
INSERT INTO achievements (name, title, description, icon, category, points) VALUES
('first_checkin', 'First Check-in', 'Complete your first zone check-in', '🏁', 'progress', 10),
('zone_master', 'Zone Master', 'Complete all rally zones', '🏆', 'completion', 100),
('early_bird', 'Early Bird', 'First to check in at event', '🌅', 'special', 50),
('photo_star', 'Photo Star', 'Upload 10 photos', '📸', 'social', 30),
('story_teller', 'Story Teller', 'Share your ride story', '📖', 'social', 25),
('half_way', 'Half Way There', 'Complete 50% of zones', '🎯', 'progress', 40),
('explorer', 'Explorer', 'Visit all 4 regions', '🗺️', 'completion', 60),
('photographer', 'Photographer', 'Upload 25 photos', '📷', 'social', 50),
('social_butterfly', 'Social Butterfly', 'Get 50 likes on photos', '🦋', 'social', 40),
('night_rider', 'Night Rider', 'Check in after 8 PM', '🌙', 'special', 30)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ride_stories_updated_at
  BEFORE UPDATE ON ride_stories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE participants IS 'Registered rally participants';
COMMENT ON TABLE rally_zone_checkins IS 'Zone check-ins for Concept B - simple location-based checkins';
COMMENT ON TABLE achievements IS 'Achievement definitions and criteria';
COMMENT ON TABLE ride_stories IS 'Participant ride stories (synced with Sanity CMS)';
COMMENT ON TABLE participant_photos IS 'Photos uploaded by participants during the rally';
COMMENT ON TABLE emergency_sos IS 'Emergency assistance requests with location';
COMMENT ON TABLE push_notifications_history IS 'History of all push notifications sent';
COMMENT ON TABLE scheduled_reports IS 'Automated report generation schedule';
