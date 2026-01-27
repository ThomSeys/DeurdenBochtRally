-- Create rally_zone_checkins table for Concept B
-- QR-based check-in/check-out system for Rally Zones

-- Drop existing table if it has the old schema
DROP TABLE IF EXISTS rally_zone_checkins CASCADE;

CREATE TABLE rally_zone_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  rally_zone_id TEXT NOT NULL, -- Sanity rallyZoneV2 _id
  action TEXT NOT NULL CHECK (action IN ('CHECKIN', 'CHECKOUT')),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  qr_code TEXT NOT NULL,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_rally_zone_checkins_participant ON rally_zone_checkins(participant_id);
CREATE INDEX IF NOT EXISTS idx_rally_zone_checkins_zone ON rally_zone_checkins(rally_zone_id);
CREATE INDEX IF NOT EXISTS idx_rally_zone_checkins_action ON rally_zone_checkins(action);
CREATE INDEX IF NOT EXISTS idx_rally_zone_checkins_checked_at ON rally_zone_checkins(checked_at DESC);

-- RLS Policies
ALTER TABLE rally_zone_checkins ENABLE ROW LEVEL SECURITY;

-- Participants can view their own check-ins
CREATE POLICY "Participants can view own check-ins"
  ON rally_zone_checkins
  FOR SELECT
  USING (participant_id = auth.uid());

-- Participants can insert their own check-ins
CREATE POLICY "Participants can insert own check-ins"
  ON rally_zone_checkins
  FOR INSERT
  WITH CHECK (participant_id = auth.uid());

-- Admins can view all check-ins
CREATE POLICY "Admins can view all check-ins"
  ON rally_zone_checkins
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE participants.id = auth.uid()
      AND participants.is_admin = true
    )
  );

-- Admins can insert check-ins (manual override)
CREATE POLICY "Admins can insert any check-ins"
  ON rally_zone_checkins
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM participants
      WHERE participants.id = auth.uid()
      AND participants.is_admin = true
    )
  );

-- Admins can update check-ins
CREATE POLICY "Admins can update check-ins"
  ON rally_zone_checkins
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE participants.id = auth.uid()
      AND participants.is_admin = true
    )
  );

-- Admins can delete check-ins
CREATE POLICY "Admins can delete check-ins"
  ON rally_zone_checkins
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE participants.id = auth.uid()
      AND participants.is_admin = true
    )
  );

-- Comments
COMMENT ON TABLE rally_zone_checkins IS 'Concept B: QR-based check-in/check-out tracking for Rally Zones';
COMMENT ON COLUMN rally_zone_checkins.rally_zone_id IS 'Sanity rallyZoneV2 document _id';
COMMENT ON COLUMN rally_zone_checkins.action IS 'CHECKIN (entering zone) or CHECKOUT (leaving zone)';
COMMENT ON COLUMN rally_zone_checkins.qr_code IS 'QR code scanned (format: RZ{order}-{action}-{zoneId})';
COMMENT ON COLUMN rally_zone_checkins.latitude IS 'Optional GPS latitude at time of scan';
COMMENT ON COLUMN rally_zone_checkins.longitude IS 'Optional GPS longitude at time of scan';
