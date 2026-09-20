
-- 1. Fix downloads admin policy: public role -> authenticated
DROP POLICY IF EXISTS "Admin manage downloads" ON public.downloads;
CREATE POLICY "Admin manage downloads" ON public.downloads
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix support_messages permissive INSERT (with_check = true)
DROP POLICY IF EXISTS "Support public insert" ON public.support_messages;
CREATE POLICY "Support public insert" ON public.support_messages
  AS PERMISSIVE FOR INSERT TO anon, authenticated
  WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

-- 3. Split artworks SELECT into per-role policies so anon does not need has_role EXECUTE
DROP POLICY IF EXISTS "Artworks public read" ON public.artworks;
CREATE POLICY "Artworks anon read" ON public.artworks
  FOR SELECT TO anon
  USING (is_published = true);
CREATE POLICY "Artworks authenticated read" ON public.artworks
  FOR SELECT TO authenticated
  USING (is_published = true OR has_role(auth.uid(), 'admin'::app_role));

-- 4. Same split for blog_posts
DROP POLICY IF EXISTS "Posts public read" ON public.blog_posts;
CREATE POLICY "Posts anon read" ON public.blog_posts
  FOR SELECT TO anon
  USING (is_published = true);
CREATE POLICY "Posts authenticated read" ON public.blog_posts
  FOR SELECT TO authenticated
  USING (is_published = true OR has_role(auth.uid(), 'admin'::app_role));

-- 5. Lock down SECURITY DEFINER function execution
REVOKE ALL ON FUNCTION public.consume_download(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
-- (authenticated + service_role retain EXECUTE; policies for anon no longer call has_role)

-- 6. Remove broad public listing on artwork-previews bucket.
-- Public bucket files remain accessible via public object URLs; only listing is removed.
DROP POLICY IF EXISTS "Public read artwork-previews" ON storage.objects;
