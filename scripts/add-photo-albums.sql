-- Photo Albums Feature
-- Allows admin to toggle photo galleries per rally zone

-- Photo albums per rally zone
CREATE TABLE IF NOT EXISTS photo_albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id TEXT NOT NULL UNIQUE,
  zone_name TEXT NOT NULL,
  is_open BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default albums for the 4 rally zones
INSERT INTO photo_albums (zone_id, zone_name, description) VALUES
('vlaamse-ardennen', 'Vlaamse Ardennen', 'Foto''s van de heuvels en panoramische uitzichten'),
('condroz', 'Condroz', 'Foto''s van de historische rally route'),
('ardennen-ourthe', 'Ardennen - Ourthe Vallei', 'Foto''s van de prachtige rivierroutes'),
('hoge-venen', 'Hoge Venen', 'Foto''s van de bossen en natuurgebieden')
ON CONFLICT (zone_id) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_photo_albums_zone_id ON photo_albums(zone_id);
CREATE INDEX IF NOT EXISTS idx_photo_albums_is_open ON photo_albums(is_open) WHERE is_open = TRUE;

-- RLS Policies
ALTER TABLE photo_albums ENABLE ROW LEVEL SECURITY;

-- Everyone can view all albums (to see which are open)
CREATE POLICY "Everyone can view photo albums"
  ON photo_albums FOR SELECT
  USING (true);

-- Only admins can update album status
CREATE POLICY "Admins can update photo albums"
  ON photo_albums FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE participants.id::text = auth.uid()::text
      AND participants.is_admin = TRUE
    )
  );

-- View: Photos per album (only approved photos in open albums)
CREATE OR REPLACE VIEW public_photo_albums AS
SELECT 
  pa.id AS album_id,
  pa.zone_id,
  pa.zone_name,
  pa.description AS album_description,
  pa.is_open,
  pp.id AS photo_id,
  pp.image_url,
  pp.thumbnail_url,
  pp.caption,
  pp.location_lat,
  pp.location_lng,
  pp.uploaded_at,
  pp.like_count,
  p.id AS participant_id,
  p.first_name || ' ' || p.last_name AS participant_name,
  p.profile_photo_url AS participant_photo
FROM photo_albums pa
LEFT JOIN participant_photos pp ON pp.zone_id = pa.zone_id AND pp.is_approved = TRUE
LEFT JOIN participants p ON pp.participant_id = p.id
WHERE pa.is_open = TRUE
ORDER BY pa.zone_name, pp.uploaded_at DESC;

-- Function to get album stats
CREATE OR REPLACE FUNCTION get_album_stats(p_zone_id TEXT DEFAULT NULL)
RETURNS TABLE (
  zone_id TEXT,
  zone_name TEXT,
  is_open BOOLEAN,
  total_photos INTEGER,
  approved_photos INTEGER,
  pending_photos INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.zone_id,
    pa.zone_name,
    pa.is_open,
    COUNT(pp.id)::INTEGER AS total_photos,
    COUNT(pp.id) FILTER (WHERE pp.is_approved = TRUE)::INTEGER AS approved_photos,
    COUNT(pp.id) FILTER (WHERE pp.is_approved = FALSE)::INTEGER AS pending_photos
  FROM photo_albums pa
  LEFT JOIN participant_photos pp ON pp.zone_id = pa.zone_id
  WHERE p_zone_id IS NULL OR pa.zone_id = p_zone_id
  GROUP BY pa.zone_id, pa.zone_name, pa.is_open
  ORDER BY pa.zone_name;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_photo_album_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_photo_album_updated_at
  BEFORE UPDATE ON photo_albums
  FOR EACH ROW
  EXECUTE FUNCTION update_photo_album_updated_at();

-- Grant permissions
GRANT SELECT ON public_photo_albums TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_album_stats TO authenticated;
