-- ============================================================
-- Migration: create participants table
-- Project:   Deur Den Bocht 2026
-- Run this in: Supabase Dashboard → SQL Editor
-- After running, regenerate types: npm run gen:types
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────────────────────

create type public.event_type as enum (
  'adventurous',   -- longer route, more rally zones, more points
  'trailblazer'    -- shorter route, curated choice points
);

create type public.participant_status as enum (
  'pending',       -- registered, payment not yet confirmed
  'confirmed',     -- payment confirmed, fully enrolled
  'cancelled'      -- withdrawn or payment failed
);

create type public.motorcycle_category as enum (
  'adventure',
  'naked',
  'sport',
  'touring',
  'enduro',
  'custom',
  'other'
);

-- ── Table ─────────────────────────────────────────────────────────────────────

create table public.participants (
  -- identity
  id                uuid primary key default gen_random_uuid(),

  -- personal info
  first_name        text not null,
  last_name         text not null,
  email             text not null,
  phone             text,

  -- emergency contact
  emergency_name    text,
  emergency_phone   text,

  -- motorcycle
  motorcycle_brand  text,
  motorcycle_model  text,
  motorcycle_year   smallint,
  motorcycle_category public.motorcycle_category not null default 'other',
  license_plate     text,

  -- event
  event_choice      public.event_type not null,
  team_name         text,               -- optional: riders can form a named group

  -- status & payment
  status            public.participant_status not null default 'pending',
  payment_reference text,               -- Stripe payment intent / checkout session id

  -- auth link (optional — only set when rider creates an account)
  user_id           uuid references auth.users(id) on delete set null,

  -- audit
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- unique email per event (one registration per address)
create unique index participants_email_unique on public.participants (lower(email));

-- fast lookup by user_id and status
create index participants_user_id_idx  on public.participants (user_id);
create index participants_status_idx   on public.participants (status);
create index participants_choice_idx   on public.participants (event_choice);

-- ── Updated-at trigger ────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger participants_updated_at
  before update on public.participants
  for each row execute function public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table public.participants enable row level security;

-- Anyone (anon + authenticated) may register (insert their own row).
create policy "participants: public insert"
  on public.participants
  for insert
  to anon, authenticated
  with check (true);

-- Authenticated rider can read their own registration.
create policy "participants: rider read own"
  on public.participants
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Authenticated rider can update their own registration (pre-confirmation).
create policy "participants: rider update own"
  on public.participants
  for update
  to authenticated
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id);

-- ── Admin helper (service-role bypasses RLS automatically) ───────────────────
-- Optionally: create a separate admin role policy if you expose an RLS-based
-- admin query rather than using the service-role key.
