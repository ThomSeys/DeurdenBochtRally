-- Create riding buddies table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS riding_buddies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  buddy_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'declined')),
  UNIQUE(participant_id, buddy_id),
  CHECK (participant_id != buddy_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_riding_buddies_participant ON riding_buddies(participant_id);
CREATE INDEX IF NOT EXISTS idx_riding_buddies_buddy ON riding_buddies(buddy_id);

-- RLS Policies
ALTER TABLE riding_buddies ENABLE ROW LEVEL SECURITY;

-- Users can view their own buddy relationships (both directions)
CREATE POLICY "riding_buddies_select_own"
ON riding_buddies
FOR SELECT
USING (
  auth.uid()::text = participant_id::text 
  OR auth.uid()::text = buddy_id::text
);

-- Users can add buddies
CREATE POLICY "riding_buddies_insert_own"
ON riding_buddies
FOR INSERT
WITH CHECK (auth.uid()::text = participant_id::text);

-- Users can remove buddies
CREATE POLICY "riding_buddies_delete_own"
ON riding_buddies
FOR DELETE
USING (auth.uid()::text = participant_id::text);

-- Create a view that shows buddies in both directions (makes querying easier)
CREATE OR REPLACE VIEW participant_buddies AS
SELECT 
  rb.participant_id,
  rb.buddy_id,
  p.first_name AS buddy_first_name,
  p.last_name AS buddy_last_name,
  p.email AS buddy_email,
  p.phone AS buddy_phone,
  p.motorcycle_brand AS buddy_motorcycle_brand,
  p.motorcycle_model AS buddy_motorcycle_model,
  p.profile_photo_url AS buddy_profile_photo_url,
  p.route_preference AS buddy_route_preference,
  rb.created_at,
  rb.status
FROM riding_buddies rb
JOIN participants p ON p.id = rb.buddy_id
UNION ALL
SELECT 
  rb.buddy_id AS participant_id,
  rb.participant_id AS buddy_id,
  p.first_name AS buddy_first_name,
  p.last_name AS buddy_last_name,
  p.email AS buddy_email,
  p.phone AS buddy_phone,
  p.motorcycle_brand AS buddy_motorcycle_brand,
  p.motorcycle_model AS buddy_motorcycle_model,
  p.profile_photo_url AS buddy_profile_photo_url,
  p.route_preference AS buddy_route_preference,
  rb.created_at,
  rb.status
FROM riding_buddies rb
JOIN participants p ON p.id = rb.participant_id;

-- Grant access to the view
GRANT SELECT ON participant_buddies TO authenticated;

-- Comment
COMMENT ON TABLE riding_buddies IS 'Many-to-many relationship table for riding buddies';
COMMENT ON VIEW participant_buddies IS 'View that shows buddy relationships in both directions for easier querying';
