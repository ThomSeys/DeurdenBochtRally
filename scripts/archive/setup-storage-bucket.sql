-- Create Supabase Storage bucket for participant photos
-- This should be run in the Supabase SQL Editor or via psql

-- Note: Storage buckets are typically created via the Supabase Dashboard or API
-- This script documents the required policies

-- Storage policies for the 'participant-photos' bucket
-- (Bucket must be created first via Dashboard: Storage > New Bucket > 'participant-photos' > Public)

-- Policy: Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload their own photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'participant-photos' AND
  (storage.foldername(name))[1] = 'rally-photos'
);

-- Policy: Allow public read access to approved photos
CREATE POLICY "Public can view photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'participant-photos');

-- Policy: Allow users to delete their own photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'participant-photos' AND
  (storage.foldername(name))[1] = 'rally-photos'
);

-- Policy: Allow service role full access (for admin operations)
CREATE POLICY "Service role has full access"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'participant-photos')
WITH CHECK (bucket_id = 'participant-photos');
