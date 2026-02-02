-- Add criteria to existing achievements
-- This makes the achievement system dynamic and configurable

-- First check-in (1 zone)
UPDATE achievements 
SET criteria = jsonb_build_object(
  'type', 'zones',
  'value', 1
)
WHERE name = 'first_checkin';

-- Zone Master (complete all zones - assume 5 zones total)
UPDATE achievements 
SET criteria = jsonb_build_object(
  'type', 'zones',
  'value', 5
)
WHERE name = 'zone_master';

-- Early Bird (check-in before 08:00)
UPDATE achievements 
SET criteria = jsonb_build_object(
  'type', 'checkin_time',
  'time_before', '08:00'
)
WHERE name = 'early_bird';

-- Photo Star (upload 10 photos)
UPDATE achievements 
SET criteria = jsonb_build_object(
  'type', 'photos',
  'value', 10
)
WHERE name = 'photo_star';

-- Story Teller (share 1 ride story)
UPDATE achievements 
SET criteria = jsonb_build_object(
  'type', 'stories',
  'value', 1
)
WHERE name = 'story_teller';

-- Half Way There (complete 50% = 3 zones out of 5)
UPDATE achievements 
SET criteria = jsonb_build_object(
  'type', 'zones',
  'value', 3
)
WHERE name = 'half_way';

-- Explorer (visit all zones - this is same as zone_master, adjust based on your needs)
UPDATE achievements 
SET criteria = jsonb_build_object(
  'type', 'zones',
  'value', 5
)
WHERE name = 'explorer';

-- Photographer (upload 25 photos)
UPDATE achievements 
SET criteria = jsonb_build_object(
  'type', 'photos',
  'value', 25
)
WHERE name = 'photographer';

-- Social Butterfly (get 50 likes on photos)
UPDATE achievements 
SET criteria = jsonb_build_object(
  'type', 'likes',
  'value', 50
)
WHERE name = 'social_butterfly';

-- Night Rider (check in after 20:00)
UPDATE achievements 
SET criteria = jsonb_build_object(
  'type', 'checkin_time',
  'time_after', '20:00'
)
WHERE name = 'night_rider';

-- Example of a combo achievement (you can add this manually via admin UI later)
-- This would require: 3 zones + 5 photos + 1 story
/*
INSERT INTO achievements (name, title, description, icon, category, points, criteria) 
VALUES (
  'super_achiever',
  'Super Achiever',
  'Complete 3 zones, upload 5 photos, and share your story',
  '⭐',
  'special',
  75,
  jsonb_build_object(
    'type', 'combo',
    'conditions', jsonb_build_array(
      jsonb_build_object('type', 'zones', 'value', 3),
      jsonb_build_object('type', 'photos', 'value', 5),
      jsonb_build_object('type', 'stories', 'value', 1)
    )
  )
)
ON CONFLICT (name) DO UPDATE SET
  criteria = EXCLUDED.criteria;
*/
