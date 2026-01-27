-- Emergency SOS alerts table
CREATE TABLE IF NOT EXISTS emergency_sos_alerts (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  participant_name TEXT NOT NULL,
  participant_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved', 'cancelled')),
  acknowledged_by INTEGER REFERENCES participants(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_by INTEGER REFERENCES participants(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_emergency_sos_participant ON emergency_sos_alerts(participant_id);
CREATE INDEX IF NOT EXISTS idx_emergency_sos_status ON emergency_sos_alerts(status);
CREATE INDEX IF NOT EXISTS idx_emergency_sos_created ON emergency_sos_alerts(created_at DESC);

-- Add RLS policies
ALTER TABLE emergency_sos_alerts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own SOS alerts
CREATE POLICY "Users can create their own SOS alerts"
  ON emergency_sos_alerts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    participant_id IN (
      SELECT id FROM participants WHERE user_id = auth.uid()
    )
  );

-- Allow users to view their own SOS alerts
CREATE POLICY "Users can view their own SOS alerts"
  ON emergency_sos_alerts
  FOR SELECT
  TO authenticated
  USING (
    participant_id IN (
      SELECT id FROM participants WHERE user_id = auth.uid()
    )
    OR
    -- Admins can view all alerts
    EXISTS (
      SELECT 1 FROM participants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update SOS alerts (acknowledge/resolve)
CREATE POLICY "Admins can update SOS alerts"
  ON emergency_sos_alerts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM participants
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_emergency_sos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER emergency_sos_updated_at
  BEFORE UPDATE ON emergency_sos_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_emergency_sos_updated_at();

-- Emergency contacts table (optional feature for notifying specific contacts)
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  relationship TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_participant ON emergency_contacts(participant_id);

-- RLS policies for emergency contacts
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own emergency contacts"
  ON emergency_contacts
  FOR ALL
  TO authenticated
  USING (
    participant_id IN (
      SELECT id FROM participants WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    participant_id IN (
      SELECT id FROM participants WHERE user_id = auth.uid()
    )
  );

-- Function to get nearby buddies (participants within certain radius)
CREATE OR REPLACE FUNCTION get_nearby_buddies(
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_radius_km DECIMAL DEFAULT 5
)
RETURNS TABLE (
  participant_id INTEGER,
  participant_name TEXT,
  distance_km DECIMAL,
  last_checkin_lat DECIMAL,
  last_checkin_lng DECIMAL,
  last_checkin_time TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    -- Calculate distance using Haversine formula
    ROUND(
      (6371 * acos(
        cos(radians(p_latitude)) *
        cos(radians(c.latitude)) *
        cos(radians(c.longitude) - radians(p_longitude)) +
        sin(radians(p_latitude)) *
        sin(radians(c.latitude))
      ))::numeric,
      2
    ) as distance,
    c.latitude,
    c.longitude,
    c.checked_in_at
  FROM participants p
  INNER JOIN (
    SELECT DISTINCT ON (participant_id)
      participant_id,
      latitude,
      longitude,
      checked_in_at
    FROM checkins
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    ORDER BY participant_id, checked_in_at DESC
  ) c ON c.participant_id = p.id
  WHERE
    -- Basic distance filter (square approximation for performance)
    c.latitude BETWEEN (p_latitude - (p_radius_km / 111.0)) AND (p_latitude + (p_radius_km / 111.0))
    AND c.longitude BETWEEN (p_longitude - (p_radius_km / 111.0)) AND (p_longitude + (p_radius_km / 111.0))
    -- More precise Haversine calculation
    AND (
      6371 * acos(
        cos(radians(p_latitude)) *
        cos(radians(c.latitude)) *
        cos(radians(c.longitude) - radians(p_longitude)) +
        sin(radians(p_latitude)) *
        sin(radians(c.latitude))
      )
    ) <= p_radius_km
    -- Only recent check-ins (last 2 hours)
    AND c.checked_in_at >= NOW() - INTERVAL '2 hours'
  ORDER BY distance ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
