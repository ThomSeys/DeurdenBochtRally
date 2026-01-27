-- Quick setup for participant-photos storage bucket
-- Run this in Supabase SQL Editor or via psql

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'participant-photos',
  'participant-photos', 
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Verify it was created
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'participant-photos';
