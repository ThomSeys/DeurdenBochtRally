-- Add allow_early_access column to participants table
-- This allows bypassing the 2-day before event restriction for documents

ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS allow_early_access BOOLEAN DEFAULT FALSE;

-- Update existing admin/test accounts if needed
-- EXAMPLE: UPDATE participants SET allow_early_access = true WHERE email = 'admin@example.com';
