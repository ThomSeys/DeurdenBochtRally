-- Retroactively unlock achievements for existing participants
-- This checks all participants with rally submissions and unlocks achievements they've earned

-- Step 1: First, let's see what we have
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.total_achievement_points,
  rs.id as submission_id,
  (
    CASE WHEN rs.rz1_code IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN rs.rz2_code IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN rs.rz3_code IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN rs.rz4_code IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN rs.rz5_code IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN rs.rz6_code IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN rs.rz7_code IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN rs.rz8_code IS NOT NULL THEN 1 ELSE 0 END
  ) as zones_completed
FROM participants p
LEFT JOIN rally_submissions rs ON p.id = rs.participant_id
WHERE rs.id IS NOT NULL
ORDER BY zones_completed DESC, p.first_name;

-- This shows you which participants have submissions and how many zones they completed
-- To unlock achievements, you'll need to run the TypeScript function for each participant
