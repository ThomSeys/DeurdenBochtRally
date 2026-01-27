-- Drop the old unique constraint that prevents multiple checkpoint records per zone
ALTER TABLE rally_zone_submissions 
DROP CONSTRAINT IF EXISTS rally_zone_submissions_participant_id_zone_id_key;

-- Add a new unique constraint that includes checkpoint_number
ALTER TABLE rally_zone_submissions
ADD CONSTRAINT rally_zone_submissions_participant_zone_checkpoint_unique 
UNIQUE (participant_id, zone_id, checkpoint_number);
