-- Insert a pending scan that requires manual validation
-- This will appear in /admin/pending-scans for admin review

-- Using participant 1: b00e83d5-69dc-4cff-b13d-19cf8d053729
-- Zone 4: Dinant – Maas (Meuse) - assuming they haven't checked in there yet

INSERT INTO rally_zone_submissions (
  participant_id, 
  zone_id, 
  entry_latitude, 
  entry_longitude, 
  entry_accuracy,
  entry_timestamp,
  answer_latitude, 
  answer_longitude, 
  answer_accuracy,
  answer_timestamp,
  submitted_answer,
  valid,
  gps_accuracy_low,
  submitted_offline,
  rhythm_score,
  view_score,
  shadow_score,
  created_at
)
VALUES (
  'b00e83d5-69dc-4cff-b13d-19cf8d053729',  -- participant_id
  '4',                                       -- zone_id (Zone 4)
  50.2600,                                   -- entry_latitude (near Dinant)
  4.9200,                                    -- entry_longitude
  75.5,                                      -- entry_accuracy (HIGH - triggers low GPS warning)
  NOW() - INTERVAL '10 minutes',           -- entry_timestamp (10 min ago)
  50.2610,                                   -- answer_latitude
  4.9220,                                    -- answer_longitude  
  82.3,                                      -- answer_accuracy (HIGH - poor GPS)
  NOW() - INTERVAL '5 minutes',            -- answer_timestamp (5 min ago)
  'maas2026',                               -- submitted_answer (example code)
  NULL,                                      -- valid = NULL (pending validation!)
  true,                                      -- gps_accuracy_low = true
  false,                                     -- submitted_offline
  8.2,                                       -- rhythm_score
  7.5,                                       -- view_score
  8.8,                                       -- shadow_score
  NOW() - INTERVAL '5 minutes'             -- created_at
);

-- Optional: Add another pending scan with offline submission flag
INSERT INTO rally_zone_submissions (
  participant_id, 
  zone_id, 
  entry_latitude, 
  entry_longitude, 
  entry_accuracy,
  entry_timestamp,
  answer_latitude, 
  answer_longitude, 
  answer_accuracy,
  answer_timestamp,
  submitted_answer,
  valid,
  gps_accuracy_low,
  submitted_offline,
  rhythm_score,
  view_score,
  shadow_score,
  created_at
)
VALUES (
  '4a64f0ef-52ba-430f-a1f5-188bb958f473',  -- participant_id (participant 2)
  '3',                                       -- zone_id (Zone 3)
  50.4095,                                   -- entry_latitude (near Charleroi)
  4.4050,                                    -- entry_longitude
  28.5,                                      -- entry_accuracy (good GPS)
  NOW() - INTERVAL '25 minutes',           -- entry_timestamp (25 min ago)
  50.4100,                                   -- answer_latitude
  4.4058,                                    -- answer_longitude  
  32.1,                                      -- answer_accuracy (acceptable)
  NOW() - INTERVAL '20 minutes',           -- answer_timestamp (20 min ago)
  'samber2026',                             -- submitted_answer (example code)
  NULL,                                      -- valid = NULL (pending validation!)
  false,                                     -- gps_accuracy_low = false
  true,                                      -- submitted_offline = true (offline submission!)
  7.9,                                       -- rhythm_score
  8.6,                                       -- view_score
  9.1,                                       -- shadow_score
  NOW() - INTERVAL '20 minutes'            -- created_at
);
