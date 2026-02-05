-- Add Route Challenge Submissions System
-- This enables participants to complete optional challenges at route locations

-- ============================================
-- CREATE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS route_challenge_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  zone_id TEXT NOT NULL,
  location_key TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('photo', 'text', 'multiple_choice', 'number')),
  
  -- Submission data
  text_answer TEXT,
  photo_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Validation
  is_correct BOOLEAN,
  is_validated BOOLEAN DEFAULT FALSE,
  validated_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  
  -- Points
  points_awarded INTEGER DEFAULT 0,
  
  -- Ensure one submission per participant per location
  UNIQUE(participant_id, zone_id, location_key)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_challenge_submissions_participant 
  ON route_challenge_submissions(participant_id);

CREATE INDEX IF NOT EXISTS idx_challenge_submissions_zone 
  ON route_challenge_submissions(zone_id);

CREATE INDEX IF NOT EXISTS idx_challenge_submissions_validated 
  ON route_challenge_submissions(is_validated) WHERE is_validated = FALSE;

CREATE INDEX IF NOT EXISTS idx_challenge_submissions_correct 
  ON route_challenge_submissions(is_correct) WHERE is_correct = TRUE;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE route_challenge_submissions ENABLE ROW LEVEL SECURITY;

-- Participants can view their own submissions
CREATE POLICY "Participants can view own challenge submissions"
  ON route_challenge_submissions
  FOR SELECT
  USING (participant_id IN (
    SELECT id FROM participants WHERE user_id = auth.uid()
  ));

-- Participants can insert their own submissions
CREATE POLICY "Participants can create challenge submissions"
  ON route_challenge_submissions
  FOR INSERT
  WITH CHECK (participant_id IN (
    SELECT id FROM participants WHERE user_id = auth.uid()
  ));

-- Only admins can update (validate) submissions
CREATE POLICY "Admins can update challenge submissions"
  ON route_challenge_submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM participants 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Admins can view all submissions
CREATE POLICY "Admins can view all challenge submissions"
  ON route_challenge_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM participants 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get challenge completion stats for a participant
CREATE OR REPLACE FUNCTION get_participant_challenge_stats(p_participant_id UUID)
RETURNS TABLE (
  total_submitted BIGINT,
  total_validated BIGINT,
  total_correct BIGINT,
  total_points_earned INTEGER,
  completion_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_submitted,
    COUNT(*) FILTER (WHERE is_validated = TRUE)::BIGINT as total_validated,
    COUNT(*) FILTER (WHERE is_correct = TRUE)::BIGINT as total_correct,
    COALESCE(SUM(points_awarded), 0)::INTEGER as total_points_earned,
    CASE 
      WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE is_correct = TRUE)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 0
    END as completion_percentage
  FROM route_challenge_submissions
  WHERE participant_id = p_participant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending validations count (for admin dashboard)
CREATE OR REPLACE FUNCTION get_pending_challenge_validations()
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM route_challenge_submissions 
    WHERE is_validated = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE route_challenge_submissions IS 'Stores participant submissions for route location challenges';
COMMENT ON COLUMN route_challenge_submissions.zone_id IS 'Sanity ID of the rally zone';
COMMENT ON COLUMN route_challenge_submissions.location_key IS '_key of the routeLocation in Sanity';
COMMENT ON COLUMN route_challenge_submissions.is_validated IS 'Whether an admin has checked this submission';
COMMENT ON COLUMN route_challenge_submissions.is_correct IS 'Whether the submission was correct (NULL until validated)';
COMMENT ON COLUMN route_challenge_submissions.points_awarded IS 'Actual points given (may differ from challenge points)';

-- ============================================
-- SAMPLE QUERIES
-- ============================================

-- Get all submissions for a participant
-- SELECT * FROM route_challenge_submissions WHERE participant_id = 'uuid-here';

-- Get pending validations for admin
-- SELECT * FROM route_challenge_submissions WHERE is_validated = FALSE ORDER BY submitted_at;

-- Get participant stats
-- SELECT * FROM get_participant_challenge_stats('uuid-here');

-- Get leaderboard by challenge points
-- SELECT 
--   p.name, 
--   SUM(rcs.points_awarded) as total_points,
--   COUNT(*) FILTER (WHERE rcs.is_correct = TRUE) as challenges_completed
-- FROM route_challenge_submissions rcs
-- JOIN participants p ON p.id = rcs.participant_id
-- WHERE rcs.is_validated = TRUE
-- GROUP BY p.id, p.name
-- ORDER BY total_points DESC;
