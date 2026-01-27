-- Ride Stories Table
CREATE TABLE IF NOT EXISTS ride_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  sanity_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  excerpt TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  like_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story Likes Table
CREATE TABLE IF NOT EXISTS ride_story_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES ride_stories(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, participant_id)
);

-- Story Comments Table
CREATE TABLE IF NOT EXISTS ride_story_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES ride_stories(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ride_stories_participant ON ride_stories(participant_id);
CREATE INDEX IF NOT EXISTS idx_ride_stories_approved ON ride_stories(is_approved);
CREATE INDEX IF NOT EXISTS idx_ride_stories_featured ON ride_stories(is_featured, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_ride_stories_published ON ride_stories(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_story_likes_story ON ride_story_likes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_participant ON ride_story_likes(participant_id);

CREATE INDEX IF NOT EXISTS idx_story_comments_story ON ride_story_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_participant ON ride_story_comments(participant_id);

-- Function to update like count
CREATE OR REPLACE FUNCTION update_story_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ride_stories 
    SET like_count = like_count + 1 
    WHERE id = NEW.story_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ride_stories 
    SET like_count = like_count - 1 
    WHERE id = OLD.story_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for like count
CREATE TRIGGER trigger_update_story_like_count
AFTER INSERT OR DELETE ON ride_story_likes
FOR EACH ROW
EXECUTE FUNCTION update_story_like_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at on stories
CREATE TRIGGER trigger_ride_stories_updated_at
BEFORE UPDATE ON ride_stories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on comments
CREATE TRIGGER trigger_story_comments_updated_at
BEFORE UPDATE ON ride_story_comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE ride_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_story_comments ENABLE ROW LEVEL SECURITY;

-- Stories: Public can view approved stories
CREATE POLICY "Anyone can view approved stories"
  ON ride_stories FOR SELECT
  USING (is_approved = true);

-- Stories: Participants can view their own stories
CREATE POLICY "Participants can view own stories"
  ON ride_stories FOR SELECT
  USING (auth.uid() = participant_id);

-- Likes: Anyone can view likes
CREATE POLICY "Anyone can view likes"
  ON ride_story_likes FOR SELECT
  USING (true);

-- Likes: Authenticated users can like
CREATE POLICY "Authenticated users can like stories"
  ON ride_story_likes FOR INSERT
  WITH CHECK (auth.uid() = participant_id);

-- Likes: Users can unlike their own likes
CREATE POLICY "Users can delete own likes"
  ON ride_story_likes FOR DELETE
  USING (auth.uid() = participant_id);

-- Comments: Anyone can view comments on approved stories
CREATE POLICY "Anyone can view comments on approved stories"
  ON ride_story_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ride_stories 
      WHERE id = story_id AND is_approved = true
    )
  );

-- Comments: Authenticated users can comment on approved stories
CREATE POLICY "Authenticated users can comment on approved stories"
  ON ride_story_comments FOR INSERT
  WITH CHECK (
    auth.uid() = participant_id AND
    EXISTS (
      SELECT 1 FROM ride_stories 
      WHERE id = story_id AND is_approved = true
    )
  );

-- Comments: Users can update/delete their own comments
CREATE POLICY "Users can update own comments"
  ON ride_story_comments FOR UPDATE
  USING (auth.uid() = participant_id);

CREATE POLICY "Users can delete own comments"
  ON ride_story_comments FOR DELETE
  USING (auth.uid() = participant_id);
