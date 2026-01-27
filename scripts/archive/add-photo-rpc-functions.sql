-- Add RPC functions for photo likes increment/decrement

-- Function to increment photo likes
CREATE OR REPLACE FUNCTION increment_photo_likes(photo_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE participant_photos
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = photo_id;
END;
$$;

-- Function to decrement photo likes
CREATE OR REPLACE FUNCTION decrement_photo_likes(photo_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE participant_photos
  SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
  WHERE id = photo_id;
END;
$$;
