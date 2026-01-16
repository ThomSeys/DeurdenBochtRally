-- Multi-Checkpoint Rally Zone System Migration
-- Implements 3-tier zone system with multiple checkpoints
-- Type A (Short): 1 checkpoint
-- Type B (Medium): 2 checkpoints  
-- Type C (Long): 3 checkpoints

-- ============================================
-- RALLY_ZONE_SUBMISSIONS TABLE UPDATES
-- ============================================

-- Add checkpoint tracking
ALTER TABLE rally_zone_submissions
  ADD COLUMN IF NOT EXISTS checkpoint_number INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_checkpoints INTEGER DEFAULT 1;

-- Update existing single submissions to checkpoint 1
UPDATE rally_zone_submissions 
SET checkpoint_number = 1, 
    total_checkpoints = 1
WHERE checkpoint_number IS NULL;

-- Add NOT NULL constraint after backfilling
ALTER TABLE rally_zone_submissions
  ALTER COLUMN checkpoint_number SET NOT NULL,
  ALTER COLUMN total_checkpoints SET NOT NULL;

-- Add check constraint
ALTER TABLE rally_zone_submissions
  ADD CONSTRAINT checkpoint_number_valid 
  CHECK (checkpoint_number >= 1 AND checkpoint_number <= total_checkpoints);

-- Create composite index for efficient checkpoint queries
CREATE INDEX IF NOT EXISTS idx_zone_submissions_checkpoint 
ON rally_zone_submissions(participant_id, zone_id, checkpoint_number);

-- Add comments
COMMENT ON COLUMN rally_zone_submissions.checkpoint_number IS 'Which checkpoint this submission is for (1-3)';
COMMENT ON COLUMN rally_zone_submissions.total_checkpoints IS 'Total number of checkpoints in this zone (1-3)';

-- ============================================
-- RALLY_SUBMISSIONS TABLE UPDATES
-- ============================================

-- Add zone type counters for scoring
ALTER TABLE rally_submissions
  ADD COLUMN IF NOT EXISTS short_zones_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS medium_zones_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS long_zones_completed INTEGER DEFAULT 0;

COMMENT ON COLUMN rally_submissions.short_zones_completed IS 'Number of Type A (short) zones completed';
COMMENT ON COLUMN rally_submissions.medium_zones_completed IS 'Number of Type B (medium) zones completed';
COMMENT ON COLUMN rally_submissions.long_zones_completed IS 'Number of Type C (long) zones completed';

-- ============================================
-- VIEWS UPDATE
-- ============================================

-- Drop and recreate rally_director_dashboard with checkpoint info
DROP VIEW IF EXISTS rally_director_dashboard;

CREATE OR REPLACE VIEW rally_director_dashboard AS
SELECT
  -- Rider info
  p.id as rider_id,
  p.first_name || ' ' || p.last_name as rider_name,
  p.license_plate,
  p.status as rider_status,
  
  -- Zone submission counts
  COUNT(DISTINCT rzs.zone_id) as zones_started,
  
  -- Checkpoint completion tracking
  COUNT(DISTINCT CONCAT(rzs.zone_id, '-', rzs.checkpoint_number)) as checkpoints_completed,
  
  -- Count zones by completion (all checkpoints done)
  COUNT(DISTINCT CASE 
    WHEN (
      SELECT COUNT(*) 
      FROM rally_zone_submissions rzs2 
      WHERE rzs2.participant_id = p.id 
        AND rzs2.zone_id = rzs.zone_id
        AND rzs2.valid = TRUE
    ) >= rzs.total_checkpoints
    THEN rzs.zone_id 
  END) as zones_fully_completed,
  
  SUM(CASE WHEN rzs.valid = TRUE THEN 1 ELSE 0 END) as checkpoints_approved,
  SUM(CASE WHEN rzs.valid IS NULL THEN 1 ELSE 0 END) as checkpoints_pending,
  SUM(CASE WHEN rzs.valid = FALSE THEN 1 ELSE 0 END) as checkpoints_rejected,
  SUM(CASE WHEN rzs.is_manual = TRUE THEN 1 ELSE 0 END) as manual_entries,
  SUM(CASE WHEN rzs.gps_accuracy_low = TRUE THEN 1 ELSE 0 END) as low_gps_count,
  
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
WHERE p.status = 'active'
GROUP BY 
  p.id, 
  p.first_name, 
  p.last_name, 
  p.license_plate, 
  p.status,
  rs.total_points,
  rs.shadow_total,
  rs.final_score,
  rs.short_zones_completed,
  rs.medium_zones_completed,
  rs.long_zones_completed
ORDER BY rs.final_score DESC NULLS LAST;

COMMENT ON VIEW rally_director_dashboard IS 'Director dashboard with multi-checkpoint zone completion tracking';
