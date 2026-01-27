-- Update emergency_sos status check constraint to include 'acknowledged'

-- Drop the old constraint
ALTER TABLE emergency_sos DROP CONSTRAINT IF EXISTS emergency_sos_status_check;

-- Add the new constraint with 'acknowledged' status
ALTER TABLE emergency_sos ADD CONSTRAINT emergency_sos_status_check 
  CHECK (status IN ('active', 'acknowledged', 'resolved', 'cancelled'));
