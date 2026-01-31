-- Add photo tagging system
-- Run this in Supabase SQL Editor

-- Photo tags table (many-to-many: photos can have multiple tags, participants can be tagged in multiple photos)
CREATE TABLE IF NOT EXISTS photo_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  photo_id UUID NOT NULL REFERENCES participant_photos(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  
  -- Who tagged this person (for notifications)
  tagged_by UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  
  UNIQUE(photo_id, participant_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_photo_tags_photo ON photo_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_participant ON photo_tags(participant_id);

-- RLS Policies
ALTER TABLE photo_tags ENABLE ROW LEVEL SECURITY;

-- Everyone can view tags
CREATE POLICY "Photo tags are viewable by everyone" ON photo_tags FOR SELECT USING (true);

-- Photo owner can add/remove tags
CREATE POLICY "Photo owner can manage tags" ON photo_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM participant_photos
      WHERE participant_photos.id = photo_tags.photo_id
      AND participant_photos.participant_id = auth.uid()
    )
  );

-- Service role can do everything
CREATE POLICY "Service role can manage all photo tags" ON photo_tags
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
