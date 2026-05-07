
-- Add file_url column to contact_submissions
ALTER TABLE public.contact_submissions
ADD COLUMN IF NOT EXISTS file_url text;

-- Create storage bucket for project files (public, 15MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('project-files', 'project-files', true, 15728640)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 15728640;

-- Storage policies
DROP POLICY IF EXISTS "Public can read project files" ON storage.objects;
CREATE POLICY "Public can read project files"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-files');

DROP POLICY IF EXISTS "Anyone can upload project files" ON storage.objects;
CREATE POLICY "Anyone can upload project files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'project-files');

DROP POLICY IF EXISTS "Admins can delete project files" ON storage.objects;
CREATE POLICY "Admins can delete project files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-files' AND public.has_role(auth.uid(), 'admin'));
