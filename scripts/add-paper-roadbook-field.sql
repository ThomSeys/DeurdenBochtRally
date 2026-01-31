-- Add paper_roadbook field to participants table
-- This field tracks if a participant wants a physical paper roadbook

ALTER TABLE participants
ADD COLUMN IF NOT EXISTS paper_roadbook BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN participants.paper_roadbook IS 'Indicates if participant wants a physical paper roadbook';
