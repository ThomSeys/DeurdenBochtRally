-- Add buddy group check-in tracking
-- Allows tracking who checked in whom

-- Add checked_in_by column to track group check-ins
ALTER TABLE rally_zone_checkins
ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES participants(id) ON DELETE SET NULL;

-- Add index for querying who checked in others
CREATE INDEX IF NOT EXISTS idx_rally_zone_checkins_checked_in_by 
ON rally_zone_checkins(checked_in_by);

-- Comment
COMMENT ON COLUMN rally_zone_checkins.checked_in_by IS 'The participant who performed the check-in. NULL if self check-in, otherwise the buddy who checked them in as part of a group.';

-- Update existing records to have self check-ins
UPDATE rally_zone_checkins
SET checked_in_by = participant_id
WHERE checked_in_by IS NULL;
