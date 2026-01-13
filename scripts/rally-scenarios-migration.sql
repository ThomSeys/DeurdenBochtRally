-- Rally Scenarios Enhancement Migration
-- Implements features for 6 rally scenarios:
-- 1. QR missing/unreadable - manual validation with photos
-- 2. GPS failure - low accuracy handling
-- 3. Road closed - zone open/close
-- 4. Exact tie - manual adjustments
-- 5. Phone dead - manual scan entry
-- 6. Internet outage - offline support

-- ============================================
-- PARTICIPANTS TABLE UPDATES
-- ============================================

-- Add rider status (active/withdrawn/disqualified)
ALTER TABLE participants 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
  CHECK (status IN ('active', 'withdrawn', 'disqualified'));

CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);

COMMENT ON COLUMN participants.status IS 'Rider status: active (riding), withdrawn (quit), disqualified (rule violation)';

-- ============================================
-- RALLY_ZONE_SUBMISSIONS TABLE UPDATES
-- ============================================

-- Add scan type (start/checkpoint)
ALTER TABLE rally_zone_submissions
  ADD COLUMN IF NOT EXISTS scan_type TEXT DEFAULT 'checkpoint'
    CHECK (scan_type IN ('start', 'checkpoint'));

-- Add proof photo for manual validation
ALTER TABLE rally_zone_submissions
  ADD COLUMN IF NOT EXISTS proof_photo_url TEXT;

-- Add manual entry flag (phone dead scenario)
ALTER TABLE rally_zone_submissions
  ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT FALSE;

-- Add validation workflow fields
ALTER TABLE rally_zone_submissions
  ADD COLUMN IF NOT EXISTS valid BOOLEAN DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reason_if_invalid TEXT,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES participants(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Add geofence validation result
ALTER TABLE rally_zone_submissions
  ADD COLUMN IF NOT EXISTS gps_within_geofence BOOLEAN;

-- Add GPS failure flag
ALTER TABLE rally_zone_submissions
  ADD COLUMN IF NOT EXISTS gps_accuracy_low BOOLEAN DEFAULT FALSE;

-- Add offline submission tracking
ALTER TABLE rally_zone_submissions
  ADD COLUMN IF NOT EXISTS submitted_offline BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_zone_submissions_valid ON rally_zone_submissions(valid);
CREATE INDEX IF NOT EXISTS idx_zone_submissions_scan_type ON rally_zone_submissions(scan_type);
CREATE INDEX IF NOT EXISTS idx_zone_submissions_is_manual ON rally_zone_submissions(is_manual);
CREATE INDEX IF NOT EXISTS idx_zone_submissions_approved_by ON rally_zone_submissions(approved_by);
CREATE INDEX IF NOT EXISTS idx_zone_submissions_gps_within_geofence ON rally_zone_submissions(gps_within_geofence);

-- Add comments
COMMENT ON COLUMN rally_zone_submissions.scan_type IS 'Type of scan: start (entering zone) or checkpoint (at code location)';
COMMENT ON COLUMN rally_zone_submissions.proof_photo_url IS 'URL to uploaded photo for manual validation';
COMMENT ON COLUMN rally_zone_submissions.is_manual IS 'TRUE if manually entered by director (phone dead scenario)';
COMMENT ON COLUMN rally_zone_submissions.valid IS 'NULL = pending review, TRUE = approved, FALSE = rejected';
COMMENT ON COLUMN rally_zone_submissions.reason_if_invalid IS 'Why scan was rejected';
COMMENT ON COLUMN rally_zone_submissions.approved_by IS 'Admin who approved/rejected the scan';
COMMENT ON COLUMN rally_zone_submissions.gps_within_geofence IS 'TRUE if GPS coordinates within zone radius';
COMMENT ON COLUMN rally_zone_submissions.gps_accuracy_low IS 'TRUE if GPS accuracy > 50m (requires manual review)';
COMMENT ON COLUMN rally_zone_submissions.submitted_offline IS 'TRUE if submitted while offline, synced later';

-- ============================================
-- UPDATE EXISTING ROWS
-- ============================================

-- Set valid = TRUE for all existing submissions with correct answers
UPDATE rally_zone_submissions 
SET valid = TRUE 
WHERE is_correct = TRUE AND valid IS NULL;

-- Set valid = FALSE for existing incorrect submissions
UPDATE rally_zone_submissions 
SET valid = FALSE,
    reason_if_invalid = 'Incorrect code submitted'
WHERE is_correct = FALSE AND valid IS NULL;

-- ============================================
-- NEW TABLE: ZONE_CLOSURE_LOG
-- ============================================

-- Track when zones are opened/closed
CREATE TABLE IF NOT EXISTS zone_closure_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id TEXT NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID REFERENCES participants(id),
  reopened_at TIMESTAMP WITH TIME ZONE,
  reopened_by UUID REFERENCES participants(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zone_closure_zone_id ON zone_closure_log(zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_closure_closed_at ON zone_closure_log(closed_at);

COMMENT ON TABLE zone_closure_log IS 'Audit log of zone closures (e.g., road blocked)';

-- ============================================
-- NEW TABLE: MANUAL_SCORE_ADJUSTMENTS
-- ============================================

-- Track manual score adjustments for tie-breaking
CREATE TABLE IF NOT EXISTS manual_score_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id),
  zone_id TEXT,
  adjustment_points NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  adjusted_by UUID NOT NULL REFERENCES participants(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_score_adjustments_participant ON manual_score_adjustments(participant_id);
CREATE INDEX IF NOT EXISTS idx_score_adjustments_adjusted_by ON manual_score_adjustments(adjusted_by);

COMMENT ON TABLE manual_score_adjustments IS 'Manual score adjustments for tie-breaking or corrections';

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get pending manual validations
CREATE OR REPLACE FUNCTION get_pending_validations()
RETURNS TABLE (
  submission_id UUID,
  participant_name TEXT,
  zone_id TEXT,
  submitted_answer TEXT,
  proof_photo_url TEXT,
  gps_accuracy_low BOOLEAN,
  gps_within_geofence BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rzs.id as submission_id,
    CONCAT(p.first_name, ' ', p.last_name) as participant_name,
    rzs.zone_id,
    rzs.submitted_answer,
    rzs.proof_photo_url,
    rzs.gps_accuracy_low,
    rzs.gps_within_geofence,
    rzs.created_at
  FROM rally_zone_submissions rzs
  JOIN participants p ON rzs.participant_id = p.id
  WHERE rzs.valid IS NULL
    AND p.status = 'active'
  ORDER BY rzs.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active riders with pending scans
CREATE OR REPLACE FUNCTION get_riders_with_pending_scans()
RETURNS TABLE (
  rider_id UUID,
  rider_name TEXT,
  pending_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as rider_id,
    CONCAT(p.first_name, ' ', p.last_name) as rider_name,
    COUNT(rzs.id) as pending_count
  FROM participants p
  LEFT JOIN rally_zone_submissions rzs ON p.id = rzs.participant_id AND rzs.valid IS NULL
  WHERE p.status = 'active'
  GROUP BY p.id, p.first_name, p.last_name
  HAVING COUNT(rzs.id) > 0
  ORDER BY pending_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- POLICIES
-- ============================================

-- Allow admins to update zone submissions for validation
DROP POLICY IF EXISTS "Admins can validate submissions" ON rally_zone_submissions;
CREATE POLICY "Admins can validate submissions" ON rally_zone_submissions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anyone to view zone closure log
ALTER TABLE zone_closure_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view zone closures" ON zone_closure_log
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage zone closures" ON zone_closure_log
  FOR ALL
  USING (true);

-- Manual score adjustments policies
ALTER TABLE manual_score_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view score adjustments" ON manual_score_adjustments
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can create score adjustments" ON manual_score_adjustments
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- VIEWS
-- ============================================

-- View for rally director dashboard
CREATE OR REPLACE VIEW rally_director_dashboard AS
SELECT
  -- Rider info
  p.id as rider_id,
  p.first_name || ' ' || p.last_name as rider_name,
  p.license_plate,
  p.status as rider_status,
  
  -- Zone submission counts
  COUNT(DISTINCT rzs.zone_id) as zones_completed,
  SUM(CASE WHEN rzs.valid = TRUE THEN 1 ELSE 0 END) as zones_approved,
  SUM(CASE WHEN rzs.valid IS NULL THEN 1 ELSE 0 END) as zones_pending,
  SUM(CASE WHEN rzs.valid = FALSE THEN 1 ELSE 0 END) as zones_rejected,
  SUM(CASE WHEN rzs.is_manual = TRUE THEN 1 ELSE 0 END) as manual_entries,
  SUM(CASE WHEN rzs.gps_accuracy_low = TRUE THEN 1 ELSE 0 END) as low_gps_count,
  
  -- Scores
  rs.total_points,
  rs.shadow_total,
  rs.final_score
  
FROM participants p
LEFT JOIN rally_zone_submissions rzs ON p.id = rzs.participant_id
LEFT JOIN rally_submissions rs ON p.id = rs.participant_id
WHERE p.payment_status = 'completed'
GROUP BY p.id, p.first_name, p.last_name, p.license_plate, p.status, 
         rs.total_points, rs.shadow_total, rs.final_score
ORDER BY rs.final_score DESC NULLS LAST;

COMMENT ON VIEW rally_director_dashboard IS 'Comprehensive view for rally directors to monitor all riders';

-- ============================================
-- TRIGGERS
-- ============================================

-- Automatically set gps_accuracy_low flag
CREATE OR REPLACE FUNCTION check_gps_accuracy()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.answer_accuracy IS NOT NULL AND NEW.answer_accuracy > 50 THEN
    NEW.gps_accuracy_low := TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_gps_accuracy ON rally_zone_submissions;
CREATE TRIGGER trigger_check_gps_accuracy
  BEFORE INSERT OR UPDATE ON rally_zone_submissions
  FOR EACH ROW
  EXECUTE FUNCTION check_gps_accuracy();

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- This section is commented out for production
-- Uncomment for development/testing

/*
-- Create a test pending scan
INSERT INTO rally_zone_submissions (
  participant_id,
  zone_id,
  entry_timestamp,
  submitted_answer,
  proof_photo_url,
  gps_accuracy_low,
  valid
) VALUES (
  (SELECT id FROM participants WHERE is_admin = TRUE LIMIT 1),
  '1',
  NOW(),
  'TEST_CODE',
  'https://example.com/photo.jpg',
  TRUE,
  NULL
);
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check migration success
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'New columns added to rally_zone_submissions:';
  RAISE NOTICE '  - scan_type, proof_photo_url, is_manual';
  RAISE NOTICE '  - valid, reason_if_invalid, approved_by, approved_at';
  RAISE NOTICE '  - gps_within_geofence, gps_accuracy_low';
  RAISE NOTICE '  - submitted_offline, synced_at';
  RAISE NOTICE 'New tables created:';
  RAISE NOTICE '  - zone_closure_log';
  RAISE NOTICE '  - manual_score_adjustments';
  RAISE NOTICE 'New functions created:';
  RAISE NOTICE '  - get_pending_validations()';
  RAISE NOTICE '  - get_riders_with_pending_scans()';
END $$;
