-- Add odometer fields to rally_submissions table

ALTER TABLE rally_submissions
ADD COLUMN IF NOT EXISTS start_km DECIMAL(10, 1),
ADD COLUMN IF NOT EXISTS end_km DECIMAL(10, 1),
ADD COLUMN IF NOT EXISTS start_km_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS end_km_locked BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN rally_submissions.start_km IS 'Starting odometer reading in kilometers';
COMMENT ON COLUMN rally_submissions.end_km IS 'Ending odometer reading in kilometers';
COMMENT ON COLUMN rally_submissions.start_km_locked IS 'Whether the start odometer value is locked and cannot be changed';
COMMENT ON COLUMN rally_submissions.end_km_locked IS 'Whether the end odometer value is locked and cannot be changed';
