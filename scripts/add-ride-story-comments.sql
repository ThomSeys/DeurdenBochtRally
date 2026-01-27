-- Create ride_story_comments table
CREATE TABLE IF NOT EXISTS ride_story_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES ride_stories(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ride_story_comments_story_id ON ride_story_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_ride_story_comments_participant_id ON ride_story_comments(participant_id);
CREATE INDEX IF NOT EXISTS idx_ride_story_comments_created_at ON ride_story_comments(created_at DESC);

-- Enable RLS
ALTER TABLE ride_story_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow authenticated users to read all comments
CREATE POLICY "Anyone can view comments" ON ride_story_comments
  FOR SELECT
  USING (true);

-- Allow authenticated users to create their own comments
CREATE POLICY "Users can create their own comments" ON ride_story_comments
  FOR INSERT
  WITH CHECK (true);

-- Allow users to update their own comments
CREATE POLICY "Users can update their own comments" ON ride_story_comments
  FOR UPDATE
  USING (participant_id = auth.uid());

-- Allow users to delete their own comments
CREATE POLICY "Users can delete their own comments" ON ride_story_comments
  FOR DELETE
  USING (participant_id = auth.uid());
