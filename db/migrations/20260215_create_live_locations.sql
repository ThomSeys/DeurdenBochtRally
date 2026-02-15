-- Migration: create live_locations table
-- Date: 2026-02-15

BEGIN;

-- Create a lightweight table to persist recent live locations from participants
CREATE TABLE IF NOT EXISTS live_locations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index to quickly query recent locations by participant or time
CREATE INDEX IF NOT EXISTS idx_live_locations_participant_recorded_at ON live_locations(participant_id, recorded_at DESC);

COMMIT;
