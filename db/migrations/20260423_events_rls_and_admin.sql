-- ============================================================
-- Migration: events RLS + admin role setup
-- Project:   Deur Den Bocht 2026
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Enable RLS on events ──────────────────────────────────────────────────────

alter table public.events enable row level security;

-- Anyone (authenticated or anon) can read events.
create policy "events: public read"
  on public.events for select
  using (true);

-- Only service-role (admin client) can mutate events.
-- The app uses adminClient() for all write operations — these policies
-- are effectively never hit for admin writes, but they guard the table
-- against rogue client-side calls.
create policy "events: service role insert"
  on public.events for insert
  with check (auth.role() = 'service_role');

create policy "events: service role update"
  on public.events for update
  using (auth.role() = 'service_role');

create policy "events: service role delete"
  on public.events for delete
  using (auth.role() = 'service_role');


-- ============================================================
-- Grant admin role to a user
-- ============================================================
-- Replace the email below with the real admin email, then run this
-- block separately in the SQL Editor.
--
-- DO NOT commit real credentials or run this in a migration file.
-- Copy and run manually.

-- UPDATE auth.users
-- SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
-- WHERE email = 'your-admin@example.com';
