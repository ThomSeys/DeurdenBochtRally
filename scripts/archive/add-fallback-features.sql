-- Fallback Features Migration
-- Implements: Manual entries, photo uploads, zone closure, points override, fallback documentation

-- ============================================
-- 1. RALLY_ZONE_SUBMISSIONS - Add fallback tracking
-- ============================================

-- Photo upload support for missed checkpoints
ALTER TABLE rally_zone_submissions
  ADD COLUMN IF NOT EXISTS fallback_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS fallback_reason TEXT CHECK (fallback_reason IN (
    'checkpoint_missed',  -- Couldn't find exact checkpoint
    'qr_damaged',         -- QR code damaged/unreadable
    'tech_failure',       -- Phone/tech issues
    'stuck_rule',         -- Used vastzitregel (parallel road)
    'doubt_rule',         -- Used twijfelregel (timeout)
    'other'
  )),
  ADD COLUMN IF NOT EXISTS fallback_notes TEXT;

-- Admin override capability
ALTER TABLE rally_zone_submissions
  ADD COLUMN IF NOT EXISTS points_override INTEGER,
  ADD COLUMN IF NOT EXISTS override_reason TEXT,
  ADD COLUMN IF NOT EXISTS override_by UUID REFERENCES participants(id),
  ADD COLUMN IF NOT EXISTS override_at TIMESTAMP WITH TIME ZONE;

-- Timestamps for fallback rule tracking
ALTER TABLE rally_zone_submissions
  ADD COLUMN IF NOT EXISTS zone_entry_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS time_in_zone_minutes INTEGER;

-- Comments
COMMENT ON COLUMN rally_zone_submissions.fallback_photo_url IS 'Photo uploaded as alternative proof when checkpoint not found';
COMMENT ON COLUMN rally_zone_submissions.fallback_reason IS 'Reason for using fallback system';
COMMENT ON COLUMN rally_zone_submissions.fallback_notes IS 'Participant notes about fallback situation';
COMMENT ON COLUMN rally_zone_submissions.points_override IS 'Admin-set points (overrides calculated points)';
COMMENT ON COLUMN rally_zone_submissions.override_reason IS 'Admin reason for manual point adjustment';
COMMENT ON COLUMN rally_zone_submissions.zone_entry_time IS 'When participant entered the zone';
COMMENT ON COLUMN rally_zone_submissions.time_in_zone_minutes IS 'Total time spent in zone (for twijfelregel tracking)';

-- ============================================
-- 2. MANUAL_CHECKPOINT_ENTRIES - Finish backup system
-- ============================================

CREATE TABLE IF NOT EXISTS manual_checkpoint_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  zone_id TEXT NOT NULL,
  checkpoint_number INTEGER NOT NULL,
  
  -- Entry details
  submitted_code TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  entry_method TEXT NOT NULL CHECK (entry_method IN (
    'finish_desk',      -- Manual entry at finish
    'admin_correction', -- Admin fixing incorrect entry
    'tech_recovery'     -- Recovery from tech failure
  )),
  
  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES participants(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Location info (optional if manually entered)
  gps_latitude NUMERIC(10, 7),
  gps_longitude NUMERIC(10, 7),
  
  -- Points
  points_awarded INTEGER,
  
  -- Admin notes
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(participant_id, zone_id, checkpoint_number)
);

CREATE INDEX IF NOT EXISTS idx_manual_entries_participant ON manual_checkpoint_entries(participant_id);
CREATE INDEX IF NOT EXISTS idx_manual_entries_verified ON manual_checkpoint_entries(verified);

ALTER TABLE manual_checkpoint_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for manual entries
CREATE POLICY "Admins can view all manual entries" ON manual_checkpoint_entries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM participants WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can insert manual entries" ON manual_checkpoint_entries
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM participants WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update manual entries" ON manual_checkpoint_entries
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM participants WHERE id = auth.uid() AND is_admin = true)
  );

COMMENT ON TABLE manual_checkpoint_entries IS 'Manual checkpoint entries made at finish or by admins for tech failures';

-- ============================================
-- 3. ZONE_CLOSURES - Zone/checkpoint closure system
-- ============================================

CREATE TABLE IF NOT EXISTS zone_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id TEXT NOT NULL,
  checkpoint_number INTEGER, -- NULL means entire zone closed
  
  -- Closure details
  is_closed BOOLEAN DEFAULT TRUE,
  closure_reason TEXT NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_by UUID REFERENCES participants(id),
  
  -- Reopening
  reopened_at TIMESTAMP WITH TIME ZONE,
  reopened_by UUID REFERENCES participants(id),
  
  -- Points handling
  points_neutralized BOOLEAN DEFAULT FALSE, -- If true, submissions get 0 points
  points_redistribution JSONB, -- {"original": 12, "adjusted": 15} etc.
  
  -- Communication
  public_message TEXT, -- Message shown to participants
  internal_notes TEXT, -- Admin-only notes
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(zone_id, checkpoint_number)
);

CREATE INDEX IF NOT EXISTS idx_zone_closures_active ON zone_closures(zone_id, is_closed) WHERE is_closed = true;

ALTER TABLE zone_closures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for zone closures
CREATE POLICY "Everyone can view active closures" ON zone_closures
  FOR SELECT USING (is_closed = true);

CREATE POLICY "Admins can manage closures" ON zone_closures
  FOR ALL USING (
    EXISTS (SELECT 1 FROM participants WHERE id = auth.uid() AND is_admin = true)
  );

COMMENT ON TABLE zone_closures IS 'Track zone and checkpoint closures with point redistribution';

-- ============================================
-- 4. FALLBACK_EVENTS - Tracking fallback rule usage
-- ============================================

CREATE TABLE IF NOT EXISTS fallback_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  zone_id TEXT NOT NULL,
  
  -- Event type
  event_type TEXT NOT NULL CHECK (event_type IN (
    'twijfel_rule',      -- Doubt rule triggered (15min+)
    'vastzit_rule',      -- Stuck rule used (parallel road)
    'checkpoint_missed', -- Checkpoint not found
    'qr_damaged',        -- QR code issue
    'tech_failure',      -- Technical problem
    'manual_entry'       -- Manual entry at finish
  )),
  
  -- Details
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  gps_latitude NUMERIC(10, 7),
  gps_longitude NUMERIC(10, 7),
  
  -- Participant notes
  participant_notes TEXT,
  
  -- Resolution
  resolved BOOLEAN DEFAULT FALSE,
  resolution_notes TEXT,
  resolved_by UUID REFERENCES participants(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fallback_events_participant ON fallback_events(participant_id);
CREATE INDEX IF NOT EXISTS idx_fallback_events_type ON fallback_events(event_type);
CREATE INDEX IF NOT EXISTS idx_fallback_events_unresolved ON fallback_events(resolved) WHERE resolved = false;

ALTER TABLE fallback_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fallback events
CREATE POLICY "Users can view own fallback events" ON fallback_events
  FOR SELECT USING (participant_id = auth.uid());

CREATE POLICY "Users can insert own fallback events" ON fallback_events
  FOR INSERT WITH CHECK (participant_id = auth.uid());

CREATE POLICY "Admins can view all fallback events" ON fallback_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM participants WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update fallback events" ON fallback_events
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM participants WHERE id = auth.uid() AND is_admin = true)
  );

COMMENT ON TABLE fallback_events IS 'Track all fallback rule usage for transparency and review';

-- ============================================
-- 5. UPDATED VIEWS
-- ============================================

-- Drop existing view
DROP VIEW IF EXISTS rally_director_dashboard;

-- Recreate with fallback info
CREATE OR REPLACE VIEW rally_director_dashboard AS
SELECT
  -- Rider info
  p.id as rider_id,
  p.first_name || ' ' || p.last_name as rider_name,
  p.license_plate,
  p.status as rider_status,
  
  -- Zone submission counts
  COUNT(DISTINCT rzs.zone_id) as zones_started,
  COUNT(DISTINCT CONCAT(rzs.zone_id, '-', rzs.checkpoint_number)) as checkpoints_completed,
  
  -- Fallback tracking
  SUM(CASE WHEN rzs.fallback_photo_url IS NOT NULL THEN 1 ELSE 0 END) as photo_submissions,
  SUM(CASE WHEN rzs.points_override IS NOT NULL THEN 1 ELSE 0 END) as overridden_submissions,
  COUNT(DISTINCT me.id) as manual_entries,
  COUNT(DISTINCT fe.id) as fallback_events,
  
  -- Checkpoint status
  SUM(CASE WHEN rzs.valid = TRUE THEN 1 ELSE 0 END) as checkpoints_approved,
  SUM(CASE WHEN rzs.valid IS NULL THEN 1 ELSE 0 END) as checkpoints_pending,
  SUM(CASE WHEN rzs.valid = FALSE THEN 1 ELSE 0 END) as checkpoints_rejected,
  
  -- Scores
  rs.total_points,
  rs.shadow_total,
  rs.final_score,
  rs.short_zones_completed,
  rs.medium_zones_completed,
  rs.long_zones_completed
  
FROM participants p
LEFT JOIN rally_zone_submissions rzs ON p.id = rzs.participant_id
LEFT JOIN rally_submissions rs ON p.id = rs.participant_id
LEFT JOIN manual_checkpoint_entries me ON p.id = me.participant_id
LEFT JOIN fallback_events fe ON p.id = fe.participant_id
WHERE p.status = 'active'
GROUP BY 
  p.id, p.first_name, p.last_name, p.license_plate, p.status,
  rs.total_points, rs.shadow_total, rs.final_score,
  rs.short_zones_completed, rs.medium_zones_completed, rs.long_zones_completed
ORDER BY rs.total_points DESC NULLS LAST;

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Function to check if zone/checkpoint is closed
CREATE OR REPLACE FUNCTION is_zone_closed(
  p_zone_id TEXT,
  p_checkpoint_number INTEGER DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM zone_closures
    WHERE zone_id = p_zone_id
      AND (checkpoint_number = p_checkpoint_number OR checkpoint_number IS NULL)
      AND is_closed = true
  );
END;
$$;

-- Function to get effective points (considering overrides and closures)
CREATE OR REPLACE FUNCTION get_effective_points(
  p_submission_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_override INTEGER;
  v_calculated INTEGER;
  v_zone_id TEXT;
  v_checkpoint INTEGER;
  v_is_closed BOOLEAN;
BEGIN
  -- Get submission details
  SELECT points_override, total_checkpoints, zone_id, checkpoint_number
  INTO v_override, v_calculated, v_zone_id, v_checkpoint
  FROM rally_zone_submissions
  WHERE id = p_submission_id;
  
  -- Check if zone is closed
  SELECT is_zone_closed(v_zone_id, v_checkpoint) INTO v_is_closed;
  
  -- Return 0 if closed and neutralized
  IF v_is_closed AND EXISTS (
    SELECT 1 FROM zone_closures 
    WHERE zone_id = v_zone_id 
      AND checkpoint_number = v_checkpoint
      AND points_neutralized = true
  ) THEN
    RETURN 0;
  END IF;
  
  -- Return override if exists, otherwise calculated
  RETURN COALESCE(v_override, v_calculated, 0);
END;
$$;

COMMENT ON FUNCTION is_zone_closed IS 'Check if a zone or specific checkpoint is currently closed';
COMMENT ON FUNCTION get_effective_points IS 'Get final points considering overrides and closures';

-- ============================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_rally_zone_submissions_fallback ON rally_zone_submissions(participant_id) 
  WHERE fallback_photo_url IS NOT NULL OR fallback_reason IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rally_zone_submissions_override ON rally_zone_submissions(participant_id)
  WHERE points_override IS NOT NULL;

-- ============================================
-- COMPLETE
-- ============================================

SELECT 
  'Fallback features migration complete!' as message,
  (SELECT COUNT(*) FROM manual_checkpoint_entries) as manual_entries,
  (SELECT COUNT(*) FROM zone_closures) as active_closures,
  (SELECT COUNT(*) FROM fallback_events) as fallback_events;
