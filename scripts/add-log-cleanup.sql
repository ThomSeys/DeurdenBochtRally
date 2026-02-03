-- Automatic cleanup for system_logs older than 7 days
-- This keeps the database clean and prevents unbounded growth

-- Function to delete old system logs
CREATE OR REPLACE FUNCTION cleanup_old_system_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete logs older than 7 days
  DELETE FROM system_logs
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup (this log will itself be cleaned up after 7 days)
  IF deleted_count > 0 THEN
    INSERT INTO system_logs (level, category, message, metadata)
    VALUES (
      'info',
      'maintenance',
      'Cleaned up old system logs',
      jsonb_build_object('deleted_count', deleted_count, 'retention_days', 7)
    );
  END IF;
END;
$$;

-- Comment for documentation
COMMENT ON FUNCTION cleanup_old_system_logs() IS 'Deletes system_logs entries older than 7 days to prevent unbounded growth';

-- You can manually run this function at any time:
-- SELECT cleanup_old_system_logs();

-- For automatic cleanup, you have two options:

-- OPTION 1: Supabase Edge Function (recommended)
-- Create a Supabase Edge Function that calls this function daily
-- and invoke it via a cron job in your hosting environment

-- OPTION 2: Application-level cleanup
-- Call this function from your application on a daily basis
-- Example: Add a route /api/cron/cleanup-logs that runs this function

-- Note: Supabase doesn't support pg_cron by default, so you'll need to
-- trigger this manually or via an external cron service
