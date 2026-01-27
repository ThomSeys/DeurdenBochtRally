-- Create storage bucket for reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for reports bucket
CREATE POLICY "Authenticated users can view reports"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'reports');

-- Only admins can upload reports
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

-- Only admins can delete reports
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
