-- Add checked_in_at timestamp column to participants table
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_participants_checked_in_at ON participants(checked_in_at);
