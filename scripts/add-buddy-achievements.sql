-- Add buddy achievements system
-- Run this after add-riding-buddies.sql

-- Buddy achievements table
CREATE TABLE IF NOT EXISTS buddy_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  achievement_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- lucide icon name
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('all_zones', 'distance', 'checkpoints', 'duration')),
  requirement_value INTEGER NOT NULL,
  
  -- Display
  points INTEGER NOT NULL DEFAULT 0,
  badge_color TEXT NOT NULL DEFAULT 'blue'
);

-- Buddy group achievements (many-to-many: achievements earned by groups)
CREATE TABLE IF NOT EXISTS buddy_group_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  
  achievement_id UUID NOT NULL REFERENCES buddy_achievements(id) ON DELETE CASCADE,
  
  -- The group is defined by the first participant who earned it
  -- All their buddies at that time are part of this achievement
  primary_participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  
  -- Progress tracking
  progress_value INTEGER DEFAULT 0,
  is_unlocked BOOLEAN DEFAULT FALSE,
  
  UNIQUE(achievement_id, primary_participant_id)
);

-- Member tracking for group achievements
CREATE TABLE IF NOT EXISTS buddy_group_achievement_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_achievement_id UUID NOT NULL REFERENCES buddy_group_achievements(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  
  UNIQUE(group_achievement_id, participant_id)
);

-- Insert default buddy achievements
INSERT INTO buddy_achievements (achievement_key, name, description, icon, requirement_type, requirement_value, points, badge_color) VALUES
('buddy_all_zones', 'Zone Explorers', 'Bezoek alle rally zones samen met je buddies', 'map-pin', 'all_zones', 100, 50, 'purple'),
('buddy_50km', '50km Together', 'Rijd minimaal 50km samen', 'route', 'distance', 50, 20, 'blue'),
('buddy_100km', '100km Together', 'Rijd minimaal 100km samen', 'route', 'distance', 100, 40, 'indigo'),
('buddy_5_checkpoints', 'Checkpoint Champions', 'Check in bij 5 rally zones samen', 'flag', 'checkpoints', 5, 15, 'green'),
('buddy_10_checkpoints', 'Rally Masters', 'Check in bij 10 rally zones samen', 'flag', 'checkpoints', 10, 30, 'emerald'),
('buddy_4h_ride', '4 Hour Adventure', 'Rijd minimaal 4 uur samen', 'clock', 'duration', 240, 25, 'orange'),
('buddy_sunrise', 'Early Birds', 'Check in voor 08:00 bij een zone samen', 'sunrise', 'checkpoints', 1, 20, 'yellow'),
('buddy_trio', 'Three Musketeers', 'Vorm een groep van 3 buddies', 'users', 'checkpoints', 1, 15, 'teal')
ON CONFLICT (achievement_key) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_buddy_group_achievements_participant ON buddy_group_achievements(primary_participant_id);
CREATE INDEX IF NOT EXISTS idx_buddy_group_achievements_achievement ON buddy_group_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_buddy_group_achievement_members_participant ON buddy_group_achievement_members(participant_id);

-- RLS Policies
ALTER TABLE buddy_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE buddy_group_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE buddy_group_achievement_members ENABLE ROW LEVEL SECURITY;

-- Everyone can view achievements
CREATE POLICY "Buddy achievements are viewable by everyone" ON buddy_achievements FOR SELECT USING (true);

-- Users can view group achievements they're part of
CREATE POLICY "Users can view their group achievements" ON buddy_group_achievements FOR SELECT 
  USING (
    primary_participant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM buddy_group_achievement_members
      WHERE buddy_group_achievement_members.group_achievement_id = buddy_group_achievements.id
      AND buddy_group_achievement_members.participant_id = auth.uid()
    )
  );

-- Users can view members of achievements they're part of
CREATE POLICY "Users can view group achievement members" ON buddy_group_achievement_members FOR SELECT
  USING (
    participant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM buddy_group_achievement_members bgam2
      WHERE bgam2.group_achievement_id = buddy_group_achievement_members.group_achievement_id
      AND bgam2.participant_id = auth.uid()
    )
  );

-- Function to check and unlock buddy achievements
CREATE OR REPLACE FUNCTION check_buddy_achievements(p_participant_id UUID)
RETURNS void AS $$
DECLARE
  buddy_ids UUID[];
  zone_count INTEGER;
BEGIN
  -- Get all buddy IDs for this participant
  SELECT ARRAY_AGG(DISTINCT buddy_id) INTO buddy_ids
  FROM participant_buddies
  WHERE participant_id = p_participant_id;
  
  IF buddy_ids IS NULL OR array_length(buddy_ids, 1) = 0 THEN
    RETURN;
  END IF;
  
  -- Check "5 checkpoints together" achievement
  -- Count zones where participant and at least one buddy both checked in
  SELECT COUNT(DISTINCT rzc1.zone_id) INTO zone_count
  FROM rally_zone_checkins rzc1
  WHERE rzc1.participant_id = p_participant_id
  AND EXISTS (
    SELECT 1 FROM rally_zone_checkins rzc2
    WHERE rzc2.zone_id = rzc1.zone_id
    AND rzc2.participant_id = ANY(buddy_ids)
  );
  
  -- Unlock 5 checkpoint achievement if met
  IF zone_count >= 5 THEN
    INSERT INTO buddy_group_achievements (achievement_id, primary_participant_id, progress_value, is_unlocked)
    SELECT ba.id, p_participant_id, zone_count, true
    FROM buddy_achievements ba
    WHERE ba.achievement_key = 'buddy_5_checkpoints'
    ON CONFLICT (achievement_id, primary_participant_id) 
    DO UPDATE SET progress_value = EXCLUDED.progress_value, is_unlocked = true;
    
    -- Add all buddies as members
    INSERT INTO buddy_group_achievement_members (group_achievement_id, participant_id)
    SELECT bga.id, unnest(buddy_ids)
    FROM buddy_group_achievements bga
    JOIN buddy_achievements ba ON ba.id = bga.achievement_id
    WHERE ba.achievement_key = 'buddy_5_checkpoints'
    AND bga.primary_participant_id = p_participant_id
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Check "10 checkpoints together"
  IF zone_count >= 10 THEN
    INSERT INTO buddy_group_achievements (achievement_id, primary_participant_id, progress_value, is_unlocked)
    SELECT ba.id, p_participant_id, zone_count, true
    FROM buddy_achievements ba
    WHERE ba.achievement_key = 'buddy_10_checkpoints'
    ON CONFLICT (achievement_id, primary_participant_id)
    DO UPDATE SET progress_value = EXCLUDED.progress_value, is_unlocked = true;
    
    INSERT INTO buddy_group_achievement_members (group_achievement_id, participant_id)
    SELECT bga.id, unnest(buddy_ids)
    FROM buddy_group_achievements bga
    JOIN buddy_achievements ba ON ba.id = bga.achievement_id
    WHERE ba.achievement_key = 'buddy_10_checkpoints'
    AND bga.primary_participant_id = p_participant_id
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Check "all zones together"
  -- Assuming total zones is stored or calculated
  IF zone_count >= (SELECT COUNT(*) FROM rally_zones WHERE active = true) THEN
    INSERT INTO buddy_group_achievements (achievement_id, primary_participant_id, progress_value, is_unlocked)
    SELECT ba.id, p_participant_id, zone_count, true
    FROM buddy_achievements ba
    WHERE ba.achievement_key = 'buddy_all_zones'
    ON CONFLICT (achievement_id, primary_participant_id)
    DO UPDATE SET progress_value = EXCLUDED.progress_value, is_unlocked = true;
    
    INSERT INTO buddy_group_achievement_members (group_achievement_id, participant_id)
    SELECT bga.id, unnest(buddy_ids)
    FROM buddy_group_achievements bga
    JOIN buddy_achievements ba ON ba.id = bga.achievement_id
    WHERE ba.achievement_key = 'buddy_all_zones'
    AND bga.primary_participant_id = p_participant_id
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Check "trio" achievement (3+ buddies)
  IF array_length(buddy_ids, 1) >= 3 THEN
    INSERT INTO buddy_group_achievements (achievement_id, primary_participant_id, progress_value, is_unlocked)
    SELECT ba.id, p_participant_id, array_length(buddy_ids, 1), true
    FROM buddy_achievements ba
    WHERE ba.achievement_key = 'buddy_trio'
    ON CONFLICT (achievement_id, primary_participant_id)
    DO UPDATE SET progress_value = EXCLUDED.progress_value, is_unlocked = true;
    
    INSERT INTO buddy_group_achievement_members (group_achievement_id, participant_id)
    SELECT bga.id, unnest(buddy_ids)
    FROM buddy_group_achievements bga
    JOIN buddy_achievements ba ON ba.id = bga.achievement_id
    WHERE ba.achievement_key = 'buddy_trio'
    AND bga.primary_participant_id = p_participant_id
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check achievements after check-in
CREATE OR REPLACE FUNCTION trigger_check_buddy_achievements()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_buddy_achievements(NEW.participant_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_checkin_check_buddy_achievements ON rally_zone_checkins;
CREATE TRIGGER after_checkin_check_buddy_achievements
AFTER INSERT ON rally_zone_checkins
FOR EACH ROW
EXECUTE FUNCTION trigger_check_buddy_achievements();
