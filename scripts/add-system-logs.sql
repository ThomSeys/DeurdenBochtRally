-- Create system_logs table for application logging
CREATE TABLE IF NOT EXISTS system_logs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level VARCHAR(20) NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'critical')),
  category VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  participant_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  metadata JSONB,
  request_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  url TEXT,
  method VARCHAR(10),
  status_code INTEGER,
  error_stack TEXT,
  duration_ms INTEGER
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_participant_id ON system_logs(participant_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_request_id ON system_logs(request_id);

-- Create a composite index for common queries
CREATE INDEX IF NOT EXISTS idx_system_logs_level_created_at ON system_logs(level, created_at DESC);

-- Enable Row Level Security
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read logs
CREATE POLICY "Admins can view all logs"
  ON system_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE participants.id = auth.uid()
      AND participants.is_admin = true
    )
  );

-- Policy: System can insert logs (service role)
-- This allows the application to insert logs using the service role key
CREATE POLICY "Service role can insert logs"
  ON system_logs
  FOR INSERT
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE system_logs IS 'Application-wide logging table for debugging and monitoring';
COMMENT ON COLUMN system_logs.level IS 'Log severity: debug, info, warn, error, critical';
COMMENT ON COLUMN system_logs.category IS 'Log category for filtering (e.g., auth, api, database, etc.)';
COMMENT ON COLUMN system_logs.metadata IS 'Additional structured data related to the log entry';
COMMENT ON COLUMN system_logs.request_id IS 'Request identifier for tracing requests across logs';
