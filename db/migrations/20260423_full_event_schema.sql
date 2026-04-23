-- ============================================================
-- Migration: full event/rally schema
-- Project:   Deur Den Bocht 2026
-- Run this in: Supabase Dashboard → SQL Editor
--         OR: via npm run db:migrate (uses Management API)
-- After running: npm run gen:types
-- ============================================================

-- ── New enums ─────────────────────────────────────────────────────────────────

create type public.task_type as enum (
  'photo',         -- rider submits a photo
  'video',         -- rider submits a short video
  'quiz',          -- multiple-choice question
  'text',          -- free-text answer
  'qr',            -- scan a QR code at the location
  'gps_proximity'  -- get within X metres of a coordinate
);

create type public.answer_status as enum (
  'pending',       -- submitted, awaiting review (photo/video)
  'approved',      -- awarded points
  'rejected'       -- wrong answer or rejected by admin
);

-- ── events ────────────────────────────────────────────────────────────────────
-- One row per yearly edition of Deur Den Bocht.

create table public.events (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,                       -- e.g. "Deur Den Bocht 2026"
  slug          text not null unique,                -- e.g. "2026"
  event_date    date not null,
  registration_opens_at  timestamptz,
  registration_closes_at timestamptz,
  is_active     boolean not null default false,      -- the currently live edition
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- ── teams ─────────────────────────────────────────────────────────────────────

create table public.teams (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  name        text not null,
  invite_code text not null unique default upper(substring(gen_random_uuid()::text, 1, 8)),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (event_id, name)
);

create index teams_event_id_idx  on public.teams (event_id);
create index teams_invite_code_idx on public.teams (invite_code);

create trigger teams_updated_at
  before update on public.teams
  for each row execute function public.set_updated_at();

-- ── alter participants: add event_id + team_id ────────────────────────────────

alter table public.participants
  add column event_id uuid references public.events(id) on delete restrict,
  add column team_id  uuid references public.teams(id)  on delete set null;

-- drop the old unique-email constraint (email is now unique per event)
drop index if exists participants_email_unique;
create unique index participants_email_event_unique
  on public.participants (lower(email), event_id);

create index participants_event_id_idx on public.participants (event_id);
create index participants_team_id_idx  on public.participants (team_id);

-- ── rallies ───────────────────────────────────────────────────────────────────
-- One rally per event edition. Holds the GPX route and global rally settings.

create table public.rallies (
  id              uuid primary key default gen_random_uuid(),
  event_id        uuid not null unique references public.events(id) on delete cascade,
  name            text not null,
  description     text,
  gpx_url         text,            -- link to the GPX file in storage
  total_km        numeric(6,1),
  starts_at       timestamptz,
  ends_at         timestamptz,
  is_published    boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index rallies_event_id_idx on public.rallies (event_id);

create trigger rallies_updated_at
  before update on public.rallies
  for each row execute function public.set_updated_at();

-- ── choice_points ─────────────────────────────────────────────────────────────
-- GPS waypoints along the rally route where riders make a fork decision:
-- stay on the safe sidetrack OR enter the rally zone.

create table public.choice_points (
  id           uuid primary key default gen_random_uuid(),
  rally_id     uuid not null references public.rallies(id) on delete cascade,
  name         text not null,                  -- e.g. "Fork A — Hazepad"
  description  text,
  sort_order   smallint not null default 0,    -- order along the route
  lat          numeric(10, 7) not null,
  lng          numeric(10, 7) not null,
  -- points awarded for taking the sidetrack (fewer, but guaranteed)
  sidetrack_points smallint not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index choice_points_rally_id_idx on public.choice_points (rally_id);

create trigger choice_points_updated_at
  before update on public.choice_points
  for each row execute function public.set_updated_at();

-- ── rally_zones ───────────────────────────────────────────────────────────────
-- The free-navigation zone a rider enters when they choose the rally option
-- at a choice point. Contains an unordered set of tasks.

create table public.rally_zones (
  id              uuid primary key default gen_random_uuid(),
  choice_point_id uuid not null unique references public.choice_points(id) on delete cascade,
  name            text not null,
  description     text,
  -- bounding area for the zone (rough polygon stored as GeoJSON)
  area_geojson    jsonb,
  -- max time (minutes) a rider can spend in this zone
  time_limit_min  smallint,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index rally_zones_choice_point_id_idx on public.rally_zones (choice_point_id);

create trigger rally_zones_updated_at
  before update on public.rally_zones
  for each row execute function public.set_updated_at();

-- ── tasks ─────────────────────────────────────────────────────────────────────
-- Individual challenges inside a rally zone.

create table public.tasks (
  id              uuid primary key default gen_random_uuid(),
  rally_zone_id   uuid not null references public.rally_zones(id) on delete cascade,
  type            public.task_type not null,
  title           text not null,
  description     text,
  points          smallint not null default 0,
  sort_order      smallint not null default 0,
  is_required     boolean not null default false,
  -- type-specific config stored as JSONB:
  --   quiz:          { options: string[], correct_index: number }
  --   gps_proximity: { lat: number, lng: number, radius_meters: number }
  --   qr:            { expected_value: string }
  --   photo/video:   { instructions: string }
  --   text:          { expected_answer?: string }   (null = manual review)
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index tasks_rally_zone_id_idx on public.tasks (rally_zone_id);

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ── storage buckets ───────────────────────────────────────────────────────────
-- participant-photos : photos submitted as task answers
-- participant-videos : videos submitted as task answers

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'participant-photos',
    'participant-photos',
    false,                                   -- not public; served via signed URLs
    10485760,                                -- 10 MB per file
    array['image/jpeg','image/png','image/webp','image/heic']
  ),
  (
    'participant-videos',
    'participant-videos',
    false,
    104857600,                               -- 100 MB per file
    array['video/mp4','video/quicktime','video/webm']
  );

-- ── participant_answers ───────────────────────────────────────────────────────

create table public.participant_answers (
  id              uuid primary key default gen_random_uuid(),
  participant_id  uuid not null references public.participants(id) on delete cascade,
  task_id         uuid not null references public.tasks(id)        on delete cascade,

  -- one answer per participant per task
  unique (participant_id, task_id),

  -- answer payload (only the relevant columns are filled per task type)
  text_answer     text,                      -- quiz choice index (as text), text, qr value
  photo_path      text,                      -- storage path in participant-photos bucket
  video_path      text,                      -- storage path in participant-videos bucket
  submitted_lat   numeric(10, 7),
  submitted_lng   numeric(10, 7),

  -- scoring
  status          public.answer_status not null default 'pending',
  points_awarded  smallint,                  -- null until reviewed/auto-graded
  reviewed_by     uuid references auth.users(id) on delete set null,
  reviewed_at     timestamptz,

  submitted_at    timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index answers_participant_id_idx on public.participant_answers (participant_id);
create index answers_task_id_idx        on public.participant_answers (task_id);
create index answers_status_idx         on public.participant_answers (status);

create trigger participant_answers_updated_at
  before update on public.participant_answers
  for each row execute function public.set_updated_at();

-- ── RLS — events (public read) ────────────────────────────────────────────────

alter table public.events enable row level security;

create policy "events: public read published"
  on public.events for select
  to anon, authenticated
  using (is_active = true);

-- ── RLS — teams ───────────────────────────────────────────────────────────────

alter table public.teams enable row level security;

create policy "teams: public read"
  on public.teams for select
  to anon, authenticated
  using (true);

create policy "teams: authenticated insert"
  on public.teams for insert
  to authenticated
  with check (true);

-- ── RLS — rallies (public read when published) ────────────────────────────────

alter table public.rallies enable row level security;

create policy "rallies: public read published"
  on public.rallies for select
  to anon, authenticated
  using (is_published = true);

-- ── RLS — choice_points, rally_zones, tasks (public read) ────────────────────

alter table public.choice_points enable row level security;
create policy "choice_points: public read"
  on public.choice_points for select
  to anon, authenticated
  using (true);

alter table public.rally_zones enable row level security;
create policy "rally_zones: public read"
  on public.rally_zones for select
  to anon, authenticated
  using (true);

alter table public.tasks enable row level security;
create policy "tasks: public read"
  on public.tasks for select
  to anon, authenticated
  using (true);

-- ── RLS — participant_answers (rider owns their own) ──────────────────────────

alter table public.participant_answers enable row level security;

create policy "answers: rider read own"
  on public.participant_answers for select
  to authenticated
  using (
    participant_id in (
      select id from public.participants where user_id = auth.uid()
    )
  );

create policy "answers: rider insert own"
  on public.participant_answers for insert
  to authenticated
  with check (
    participant_id in (
      select id from public.participants where user_id = auth.uid()
    )
  );

create policy "answers: rider update own pending"
  on public.participant_answers for update
  to authenticated
  using (
    status = 'pending'
    and participant_id in (
      select id from public.participants where user_id = auth.uid()
    )
  );

-- ── Storage RLS — participant-photos ──────────────────────────────────────────

create policy "photos: rider upload own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'participant-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "photos: rider read own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'participant-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── Storage RLS — participant-videos ──────────────────────────────────────────

create policy "videos: rider upload own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'participant-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "videos: rider read own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'participant-videos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
