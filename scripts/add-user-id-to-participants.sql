-- Add user_id column to participants table to link to Auth.uid()
-- This is needed for RLS policies

ALTER TABLE participants ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);
