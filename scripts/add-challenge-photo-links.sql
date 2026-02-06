-- Link challenge photo submissions to participant_photos for likes/tags reuse
-- Run this in Supabase SQL Editor

ALTER TABLE participant_photos
ADD COLUMN IF NOT EXISTS challenge_submission_id UUID;

ALTER TABLE participant_photos
ADD CONSTRAINT participant_photos_challenge_submission_id_fkey
FOREIGN KEY (challenge_submission_id)
REFERENCES route_challenge_submissions(id)
ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_participant_photos_challenge_submission
ON participant_photos(challenge_submission_id);

-- Backfill existing challenge submissions with photos
INSERT INTO participant_photos (
  participant_id,
  image_url,
  zone_id,
  uploaded_at,
  is_approved,
  challenge_submission_id
)
SELECT
  rcs.participant_id,
  rcs.photo_url,
  rcs.zone_id,
  rcs.submitted_at,
  false,
  rcs.id
FROM route_challenge_submissions rcs
WHERE rcs.challenge_type = 'photo'
  AND rcs.photo_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM participant_photos pp
    WHERE pp.challenge_submission_id = rcs.id
  );
