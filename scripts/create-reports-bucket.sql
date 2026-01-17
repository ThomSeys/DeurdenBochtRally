-- Create reports storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for reports bucket
CREATE POLICY "Admins can upload reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'reports' AND
  EXISTS (
    SELECT 1 FROM participants
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update reports"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'reports' AND
  EXISTS (
    SELECT 1 FROM participants
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete reports"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'reports' AND
  EXISTS (
    SELECT 1 FROM participants
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Public can view reports"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'reports');
