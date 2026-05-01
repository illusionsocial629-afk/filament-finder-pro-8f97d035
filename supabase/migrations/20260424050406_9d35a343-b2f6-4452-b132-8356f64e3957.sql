-- SEO fields
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text;

-- contact_submissions
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  selected_filament text,
  use_case text,
  source text,
  processed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact"
  ON public.contact_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins/editors read contact"
  ON public.contact_submissions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor'));

CREATE POLICY "Admins update contact"
  ON public.contact_submissions FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete contact"
  ON public.contact_submissions FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- analytics_events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  session_id text,
  path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created
  ON public.analytics_events (event_type, created_at DESC);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log analytics"
  ON public.analytics_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins read analytics"
  ON public.analytics_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Editor permissions for posts (admins already have full access)
DROP POLICY IF EXISTS "Editors can insert posts" ON public.posts;
CREATE POLICY "Editors can insert posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'editor') AND auth.uid() = author_id);

DROP POLICY IF EXISTS "Editors can update posts" ON public.posts;
CREATE POLICY "Editors can update posts"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Editors can read all posts" ON public.posts;
CREATE POLICY "Editors can read all posts"
  ON public.posts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'editor'));

-- Lock down blog-images bucket: replace broad public SELECT with per-object reads via getPublicUrl
DROP POLICY IF EXISTS "Public read blog images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "blog-images public read" ON storage.objects;

-- Make bucket non-listable but still publicly readable per-object via signed/public URLs
UPDATE storage.buckets SET public = true WHERE id = 'blog-images';
