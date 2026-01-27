-- Add admin role to participants table
ALTER TABLE participants ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Set your user as admin
UPDATE participants 
SET is_admin = TRUE 
WHERE email = 'thomasseyssens82@hotmail.com';

-- Create index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_participants_is_admin ON participants(is_admin);

COMMENT ON COLUMN participants.is_admin IS 'Whether this participant has admin privileges';
