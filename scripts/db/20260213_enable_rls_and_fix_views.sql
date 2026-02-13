-- Migration: 2026-02-13
-- Purpose: Convert SECURITY DEFINER views to SECURITY INVOKER and enable RLS
-- along with starter policies for tables currently exposed to PostgREST.
-- IMPORTANT: Run this in staging first, verify PostgREST endpoints and logs,
-- then run in production during a maintenance window. This migration intentionally
-- creates permissive authenticated SELECT policies and restricts writes to the
-- service role. After verification, tighten policies to your exact ownership model.

BEGIN;

-- 1) Make views respect caller permissions (so RLS can be enforced)
ALTER VIEW IF EXISTS public.participant_year_stats SECURITY INVOKER;
ALTER VIEW IF EXISTS public.participant_buddies SECURITY INVOKER;
ALTER VIEW IF EXISTS public.public_photo_albums SECURITY INVOKER;

-- 2) Tables reported as having RLS disabled — enable RLS and add starter policies
-- List of tables: push_delivery_log, push_recipient_groups, push_message_templates,
-- scheduled_reports, report_history, report_queue

-- Helper note: this set of policies assumes your JWT contains a claim `role`
-- with values like 'anon' and 'service_role', and a subject claim available at
-- `request.jwt.claims.sub` (Supabase/PostgREST standard). Adapt as needed.

-- push_delivery_log
ALTER TABLE IF EXISTS public.push_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.push_delivery_log FORCE ROW LEVEL SECURITY;
-- Allow reads for authenticated (non-anon) users; writes only for service role
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'allow_authenticated_select' AND polrelid = 'public.push_delivery_log'::regclass) THEN
    CREATE POLICY allow_authenticated_select ON public.push_delivery_log
      FOR SELECT USING (current_setting('request.jwt.claims.role', true) IS NOT NULL AND current_setting('request.jwt.claims.role', true) <> 'anon');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'service_role_write' AND polrelid = 'public.push_delivery_log'::regclass) THEN
    CREATE POLICY service_role_write ON public.push_delivery_log
      FOR ALL USING (current_setting('request.jwt.claims.role', true) = 'service_role')
      WITH CHECK (current_setting('request.jwt.claims.role', true) = 'service_role');
  END IF;
END$$;

-- push_recipient_groups
ALTER TABLE IF EXISTS public.push_recipient_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.push_recipient_groups FORCE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'allow_authenticated_select' AND polrelid = 'public.push_recipient_groups'::regclass) THEN
    CREATE POLICY allow_authenticated_select ON public.push_recipient_groups
      FOR SELECT USING (current_setting('request.jwt.claims.role', true) IS NOT NULL AND current_setting('request.jwt.claims.role', true) <> 'anon');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'service_role_write' AND polrelid = 'public.push_recipient_groups'::regclass) THEN
    CREATE POLICY service_role_write ON public.push_recipient_groups
      FOR ALL USING (current_setting('request.jwt.claims.role', true) = 'service_role')
      WITH CHECK (current_setting('request.jwt.claims.role', true) = 'service_role');
  END IF;
END$$;

-- push_message_templates
ALTER TABLE IF EXISTS public.push_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.push_message_templates FORCE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'allow_authenticated_select' AND polrelid = 'public.push_message_templates'::regclass) THEN
    CREATE POLICY allow_authenticated_select ON public.push_message_templates
      FOR SELECT USING (current_setting('request.jwt.claims.role', true) IS NOT NULL AND current_setting('request.jwt.claims.role', true) <> 'anon');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'service_role_write' AND polrelid = 'public.push_message_templates'::regclass) THEN
    CREATE POLICY service_role_write ON public.push_message_templates
      FOR ALL USING (current_setting('request.jwt.claims.role', true) = 'service_role')
      WITH CHECK (current_setting('request.jwt.claims.role', true) = 'service_role');
  END IF;
END$$;

-- scheduled_reports
ALTER TABLE IF EXISTS public.scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.scheduled_reports FORCE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'allow_authenticated_select' AND polrelid = 'public.scheduled_reports'::regclass) THEN
    CREATE POLICY allow_authenticated_select ON public.scheduled_reports
      FOR SELECT USING (current_setting('request.jwt.claims.role', true) IS NOT NULL AND current_setting('request.jwt.claims.role', true) <> 'anon');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'service_role_write' AND polrelid = 'public.scheduled_reports'::regclass) THEN
    CREATE POLICY service_role_write ON public.scheduled_reports
      FOR ALL USING (current_setting('request.jwt.claims.role', true) = 'service_role')
      WITH CHECK (current_setting('request.jwt.claims.role', true) = 'service_role');
  END IF;
END$$;

-- report_history
ALTER TABLE IF EXISTS public.report_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.report_history FORCE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'allow_authenticated_select' AND polrelid = 'public.report_history'::regclass) THEN
    CREATE POLICY allow_authenticated_select ON public.report_history
      FOR SELECT USING (current_setting('request.jwt.claims.role', true) IS NOT NULL AND current_setting('request.jwt.claims.role', true) <> 'anon');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'service_role_write' AND polrelid = 'public.report_history'::regclass) THEN
    CREATE POLICY service_role_write ON public.report_history
      FOR ALL USING (current_setting('request.jwt.claims.role', true) = 'service_role')
      WITH CHECK (current_setting('request.jwt.claims.role', true) = 'service_role');
  END IF;
END$$;

-- report_queue
ALTER TABLE IF EXISTS public.report_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.report_queue FORCE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'allow_authenticated_select' AND polrelid = 'public.report_queue'::regclass) THEN
    CREATE POLICY allow_authenticated_select ON public.report_queue
      FOR SELECT USING (current_setting('request.jwt.claims.role', true) IS NOT NULL AND current_setting('request.jwt.claims.role', true) <> 'anon');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'service_role_write' AND polrelid = 'public.report_queue'::regclass) THEN
    CREATE POLICY service_role_write ON public.report_queue
      FOR ALL USING (current_setting('request.jwt.claims.role', true) = 'service_role')
      WITH CHECK (current_setting('request.jwt.claims.role', true) = 'service_role');
  END IF;
END$$;

COMMIT;

-- End migration
