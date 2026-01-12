-- Add dummy rally zone submissions
-- First, get a participant ID (replace with your actual participant ID)
-- You can find participant IDs by running: SELECT id, first_name, last_name, email FROM participants LIMIT 5;

-- Insert rally zone submissions for a participant
-- Replace '0eeb0b0b-bb68-41a3-bdfe-86897b439907' with an actual participant ID

-- First, insert the actual rally codes into rally_submissions table
INSERT INTO rally_submissions (
  participant_id,
  rz1_code,
  rz2_code,
  rz3_code,
  rz4_code,
  rz5_code,
  rz6_code,
  rz7_code,
  rz8_code,
  total_distance,
  start_km,
  end_km,
  used_highways,
  weather_bonus,
  total_points,
  submitted_at
) VALUES (
  '0eeb0b0b-bb68-41a3-bdfe-86897b439907',
  'Nieuwe Brug',
  'Dracula',
  'Kasteel',
  'Panorama',
  NULL,
  NULL,
  NULL,
  NULL,
  450.5,
  12345.0,
  12795.5,
  false,
  true,
  40,
  NOW()
) ON CONFLICT (participant_id) DO UPDATE SET
  rz1_code = EXCLUDED.rz1_code,
  rz2_code = EXCLUDED.rz2_code,
  rz3_code = EXCLUDED.rz3_code,
  rz4_code = EXCLUDED.rz4_code,
  rz5_code = EXCLUDED.rz5_code,
  rz6_code = EXCLUDED.rz6_code,
  rz7_code = EXCLUDED.rz7_code,
  rz8_code = EXCLUDED.rz8_code,
  total_distance = EXCLUDED.total_distance,
  start_km = EXCLUDED.start_km,
  end_km = EXCLUDED.end_km,
  used_highways = EXCLUDED.used_highways,
  weather_bonus = EXCLUDED.weather_bonus,
  total_points = EXCLUDED.total_points,
  submitted_at = EXCLUDED.submitted_at;

-- Then insert shadow scores for the zones into rally_zone_submissions table

-- Zone 1 submission (good rhythm and view scores)
INSERT INTO rally_zone_submissions (
  participant_id,
  zone_id,
  rhythm_score,
  view_score,
  shadow_score,
  zone_time_minutes,
  entry_timestamp
) VALUES (
  '0eeb0b0b-bb68-41a3-bdfe-86897b439907',
  1,
  85,
  90,
  87,
  45,
  NOW() - INTERVAL '2 hours'
);

-- Zone 2 submission (moderate scores)
INSERT INTO rally_zone_submissions (
  participant_id,
  zone_id,
  rhythm_score,
  view_score,
  shadow_score,
  zone_time_minutes,
  entry_timestamp
) VALUES (
  '0eeb0b0b-bb68-41a3-bdfe-86897b439907',
  2,
  75,
  80,
  77,
  50,
  NOW() - INTERVAL '90 minutes'
);

-- Zone 3 submission (excellent scores)
INSERT INTO rally_zone_submissions (
  participant_id,
  zone_id,
  rhythm_score,
  view_score,
  shadow_score,
  zone_time_minutes,
  entry_timestamp
) VALUES (
  '0eeb0b0b-bb68-41a3-bdfe-86897b439907',
  3,
  95,
  92,
  93,
  40,
  NOW() - INTERVAL '1 hour'
);

-- Zone 4 submission (lower scores)
INSERT INTO rally_zone_submissions (
  participant_id,
  zone_id,
  rhythm_score,
  view_score,
  shadow_score,
  zone_time_minutes,
  entry_timestamp
) VALUES (
  '0eeb0b0b-bb68-41a3-bdfe-86897b439907',
  4,
  60,
  65,
  62,
  55,
  NOW() - INTERVAL '30 minutes'
);

-- To find a participant ID to use, run this first:
-- SELECT id, first_name, last_name, email FROM participants LIMIT 5;
