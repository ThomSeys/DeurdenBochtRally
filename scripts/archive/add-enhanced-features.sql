-- Enhanced Features Migration Script
-- Run this to add support for: photos, achievements, push notifications, certificates

-- 1. Add photo gallery table
CREATE TABLE IF NOT EXISTS participant_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  location TEXT, -- Where photo was taken
  rally_zone_id INT, -- Optional: link to specific zone
  likes_count INT DEFAULT 0,
  is_approved BOOLEAN DEFAULT FALSE, -- Admin moderation
  is_featured BOOLEAN DEFAULT FALSE, -- Featured on homepage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- Emoji or icon identifier
  category TEXT NOT NULL, -- 'completion', 'speed', 'social', 'special'
  points INT DEFAULT 0,
  criteria JSONB, -- Flexible criteria for unlocking
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add participant achievements (many-to-many)
CREATE TABLE IF NOT EXISTS participant_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  achievement_id INT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_id, achievement_id)
);

-- 4. Add push subscription table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL, -- p256dh and auth keys
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Add certificate generation tracking
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'completion', 'winner', 'participation'
  pdf_url TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  downloaded_at TIMESTAMPTZ
);

-- 6. Extend participants table with social features
ALTER TABLE participants 
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS show_on_leaderboard BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS allow_location_sharing BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS total_achievement_points INT DEFAULT 0;

-- 7. Add photo likes table
CREATE TABLE IF NOT EXISTS photo_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES participant_photos(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, participant_id)
);

-- 8. Add email tracking
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL, -- 'registration', 'payment', 'rally_submission', 'reminder', 'event_alert'
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  resend_id TEXT,
  status TEXT DEFAULT 'sent' -- 'sent', 'delivered', 'bounced', 'failed'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_participant_photos_participant ON participant_photos(participant_id);
CREATE INDEX IF NOT EXISTS idx_participant_photos_approved ON participant_photos(is_approved) WHERE is_approved = TRUE;
CREATE INDEX IF NOT EXISTS idx_participant_photos_featured ON participant_photos(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_participant_achievements_participant ON participant_achievements(participant_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_participant ON push_subscriptions(participant_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_certificates_participant ON certificates(participant_id);
CREATE INDEX IF NOT EXISTS idx_photo_likes_photo ON photo_likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_participant ON email_logs(participant_id);

-- Insert default achievements
INSERT INTO achievements (name, title, description, icon, category, points, criteria) VALUES
  ('first_zone', 'Eerste Bloed', 'Voltooi je eerste rally zone', '🎯', 'completion', 10, '{"zones_completed": 1}'),
  ('half_complete', 'Halverwege Held', 'Voltooi 4 rally zones', '⭐', 'completion', 25, '{"zones_completed": 4}'),
  ('all_zones', 'Zone Meester', 'Voltooi alle 8 rally zones', '🏆', 'completion', 50, '{"zones_completed": 8}'),
  ('perfect_score', 'Perfecte Score', 'Krijg alle rally zone antwoorden correct', '💯', 'completion', 100, '{"all_correct": true}'),
  ('early_bird', 'Vroege Vogel', 'Check in voor 07:00', '🌅', 'special', 15, '{"checkin_before": "07:00"}'),
  ('weather_warrior', 'Weerkrijger', 'Voltooi rally in slecht weer', '🌧️', 'special', 30, '{"weather_bonus": true}'),
  ('marathon_rider', 'Marathon Rijder', 'Rijd meer dan 550km', '🛣️', 'completion', 40, '{"distance_over": 550}'),
  ('social_butterfly', 'Sociale Vlinder', 'Upload 5 foto''s', '📸', 'social', 20, '{"photos_uploaded": 5}'),
  ('popular', 'Populair', 'Krijg 10 likes op je foto''s', '❤️', 'social', 25, '{"photo_likes": 10}'),
  ('veteran', 'Veteraan', 'Deelgenomen aan vorige edities', '🎖️', 'special', 50, '{"editions_count": 2}')
ON CONFLICT (name) DO NOTHING;

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_participant_photos_updated_at ON participant_photos;
CREATE TRIGGER update_participant_photos_updated_at BEFORE UPDATE ON participant_photos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE participant_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Photos: Anyone can view approved photos
CREATE POLICY "Anyone can view approved photos" ON participant_photos
  FOR SELECT USING (is_approved = TRUE);

-- Photos: Participants can view their own photos
CREATE POLICY "Participants can view own photos" ON participant_photos
  FOR SELECT USING (participant_id = auth.uid());

-- Photos: Participants can insert their own photos
CREATE POLICY "Participants can insert own photos" ON participant_photos
  FOR INSERT WITH CHECK (participant_id = auth.uid());

-- Achievements: Anyone can view achievements
CREATE POLICY "Anyone can view achievements" ON achievements
  FOR SELECT TO PUBLIC USING (TRUE);

-- Participant achievements: Anyone can view
CREATE POLICY "Anyone can view participant achievements" ON participant_achievements
  FOR SELECT TO PUBLIC USING (TRUE);

-- Push subscriptions: Participants manage own subscriptions
CREATE POLICY "Participants manage own push subscriptions" ON push_subscriptions
  FOR ALL USING (participant_id = auth.uid());

-- Certificates: Participants can view own certificates
CREATE POLICY "Participants can view own certificates" ON certificates
  FOR SELECT USING (participant_id = auth.uid());

-- Photo likes: Anyone can view
CREATE POLICY "Anyone can view photo likes" ON photo_likes
  FOR SELECT TO PUBLIC USING (TRUE);

-- Photo likes: Authenticated users can like
CREATE POLICY "Users can like photos" ON photo_likes
  FOR INSERT WITH CHECK (participant_id = auth.uid());

-- Email logs: Only admins can view (implement admin check in application)

COMMENT ON TABLE participant_photos IS 'User-uploaded photos from the rally event';
COMMENT ON TABLE achievements IS 'Achievement definitions for gamification';
COMMENT ON TABLE participant_achievements IS 'Unlocked achievements per participant';
COMMENT ON TABLE push_subscriptions IS 'Web push notification subscriptions';
COMMENT ON TABLE certificates IS 'Generated certificates for participants';
COMMENT ON TABLE photo_likes IS 'Likes on participant photos';
COMMENT ON TABLE email_logs IS 'Email delivery tracking for audit trail';
