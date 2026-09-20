
CREATE POLICY "Public read artwork-previews"
ON storage.objects FOR SELECT
USING (bucket_id = 'artwork-previews');

CREATE POLICY "Admins upload artwork-previews"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'artwork-previews' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update artwork-previews"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'artwork-previews' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete artwork-previews"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'artwork-previews' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins upload artwork-files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'artwork-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update artwork-files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'artwork-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete artwork-files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'artwork-files' AND public.has_role(auth.uid(), 'admin'));
