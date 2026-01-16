-- Create storage bucket for fallback checkpoint photos
-- These are photos uploaded when participants can't find the exact checkpoint

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fallback-photos',
  'fallback-photos', 
  false, -- Not public - only accessible to admins and owner
  10485760, -- 10MB (larger for fallback documentation)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for fallback photos
-- Users can upload their own fallback photos
CREATE POLICY "Users can upload own fallback photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'fallback-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own fallback photos
CREATE POLICY "Users can view own fallback photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'fallback-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can view all fallback photos
CREATE POLICY "Admins can view all fallback photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'fallback-photos'
  AND EXISTS (
    SELECT 1 FROM participants 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Admins can delete fallback photos
CREATE POLICY "Admins can delete fallback photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'fallback-photos'
  AND EXISTS (
    SELECT 1 FROM participants 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Verify it was created
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'fallback-photos';
