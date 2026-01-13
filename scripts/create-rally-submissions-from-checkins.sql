-- Create rally_submissions entries from rally_zone_submissions
-- This populates the aggregated rally_submissions table with one row per participant

-- Delete existing test submissions first (optional - comment out if you want to keep existing data)
-- DELETE FROM rally_submissions WHERE participant_id IN ('b00e83d5-69dc-4cff-b13d-19cf8d053729', '4a64f0ef-52ba-430f-a1f5-188bb958f473');

-- Insert aggregated rally submissions for participant 1
INSERT INTO rally_submissions (
  participant_id,
  rz1_code,
  rz3_code,
  rz5_code,
  rz7_code,
  submitted_at,
  created_at
)
VALUES (
  'b00e83d5-69dc-4cff-b13d-19cf8d053729',
  'schelde2026',  -- Replace with actual solution for zone 1
  NULL,           -- Zone 3 code
  NULL,           -- Zone 5 code
  NULL,           -- Zone 7 code
  NOW(),
  NOW()
)
ON CONFLICT (participant_id) 
DO UPDATE SET
  rz1_code = EXCLUDED.rz1_code,
  rz3_code = EXCLUDED.rz3_code,
  rz5_code = EXCLUDED.rz5_code,
  rz7_code = EXCLUDED.rz7_code,
  submitted_at = EXCLUDED.submitted_at;

-- Insert aggregated rally submissions for participant 2
INSERT INTO rally_submissions (
  participant_id,
  rz2_code,
  rz4_code,
  rz6_code,
  rz8_code,
  submitted_at,
  created_at
)
VALUES (
  '4a64f0ef-52ba-430f-a1f5-188bb958f473',
  NULL,           -- Zone 2 code
  NULL,           -- Zone 4 code
  NULL,           -- Zone 6 code
  NULL,           -- Zone 8 code
  NOW(),
  NOW()
)
ON CONFLICT (participant_id) 
DO UPDATE SET
  rz2_code = EXCLUDED.rz2_code,
  rz4_code = EXCLUDED.rz4_code,
  rz6_code = EXCLUDED.rz6_code,
  rz8_code = EXCLUDED.rz8_code,
  submitted_at = EXCLUDED.submitted_at;
