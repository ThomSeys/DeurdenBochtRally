-- Clear all rally submission data from Supabase
-- This allows for a fresh start with the new rally zones

-- First, delete all checkpoint submissions (child records)
DELETE FROM checkpoint_submissions;

-- Then delete all rally submissions (parent records)
DELETE FROM rally_submissions;

-- Reset the sequences if needed (optional)
-- ALTER SEQUENCE checkpoint_submissions_id_seq RESTART WITH 1;
-- ALTER SEQUENCE rally_submissions_id_seq RESTART WITH 1;

-- Verify deletion
SELECT 
  (SELECT COUNT(*) FROM rally_submissions) as rally_submissions_count,
  (SELECT COUNT(*) FROM checkpoint_submissions) as checkpoint_submissions_count;
