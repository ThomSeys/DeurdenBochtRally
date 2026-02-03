-- Participant Audit Log
-- Tracks participant deletions, cancellations, and status changes
-- IMPORTANT: This table keeps historical records even after participant deletion

CREATE TABLE IF NOT EXISTS participant_audit_log (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Original participant info (stored, not referenced)
  participant_id UUID NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  
  -- Event details
  edition_year INTEGER,
  formula TEXT,
  ride_type TEXT,
  
  -- Payment info (kept for legal/accounting requirements)
  amount_paid INTEGER,
  payment_status TEXT,
  stripe_payment_id TEXT,
  payment_date TIMESTAMPTZ,
  
  -- Audit event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'account_deleted',
    'registration_cancelled',
    'payment_refunded',
    'data_export',
    'admin_deletion'
  )),
  reason TEXT,
  deleted_by UUID, -- NULL if self-deletion, otherwise admin ID
  
  -- Additional metadata
  metadata JSONB,
  
  -- IP and request info
  ip_address INET,
  user_agent TEXT
);

-- Indexes for querying
CREATE INDEX IF NOT EXISTS idx_participant_audit_log_created_at ON participant_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_participant_audit_log_participant_id ON participant_audit_log(participant_id);
CREATE INDEX IF NOT EXISTS idx_participant_audit_log_email ON participant_audit_log(email);
CREATE INDEX IF NOT EXISTS idx_participant_audit_log_event_type ON participant_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_participant_audit_log_edition_year ON participant_audit_log(edition_year);

-- Enable Row Level Security
ALTER TABLE participant_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON participant_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE participants.id = auth.uid()
      AND participants.is_admin = true
    )
  );

-- Policy: Service role can insert audit logs
CREATE POLICY "Service role can insert audit logs"
  ON participant_audit_log
  FOR INSERT
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE participant_audit_log IS 'Audit trail for participant deletions and cancellations. Maintains historical records for legal/accounting compliance (7 years) even after participant deletion.';
COMMENT ON COLUMN participant_audit_log.participant_id IS 'Original participant UUID - stored for reference even after deletion';
COMMENT ON COLUMN participant_audit_log.stripe_payment_id IS 'Payment reference - required for accounting/legal compliance';
COMMENT ON COLUMN participant_audit_log.deleted_by IS 'NULL for self-deletion (GDPR), UUID for admin deletions';
