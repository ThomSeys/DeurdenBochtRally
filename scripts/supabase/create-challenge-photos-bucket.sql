-- Create storage bucket for challenge photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('participant-photos', 'participant-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'participant-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to all photos
CREATE POLICY "Public can view photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'participant-photos');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'participant-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
