-- Check if pending scans were inserted correctly
SELECT 
  id,
  participant_id,
  zone_id,
  submitted_answer,
  valid,
  gps_accuracy_low,
  submitted_offline,
  created_at
FROM rally_zone_submissions
WHERE valid IS NULL
ORDER BY created_at DESC;

-- If you see results, the data is there
-- If not, check if the inserts failed or valid was set to something other than NULL

-- Also check all recent submissions for participant 1 and 2:
SELECT 
  id,
  participant_id,
  zone_id,
  submitted_answer,
  valid,
  gps_accuracy_low,
  submitted_offline,
  created_at
FROM rally_zone_submissions
WHERE participant_id IN ('b00e83d5-69dc-4cff-b13d-19cf8d053729', '4a64f0ef-52ba-430f-a1f5-188bb958f473')
ORDER BY created_at DESC
LIMIT 10;
