-- Ensure the storage schema is accessible
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.buckets TO authenticated;

-- Drop existing policies for this bucket to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow All for Admins on product-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Select" ON storage.objects;
DROP POLICY IF EXISTS "Allow Authenticated Insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Allow Authenticated Delete" ON storage.objects;

-- Create robust policies for product-images bucket
CREATE POLICY "Allow Public Select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

CREATE POLICY "Allow Authenticated Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- Ensure authenticated users have full access to the artworks related tables
GRANT ALL ON TABLE public.artworks TO authenticated;
GRANT ALL ON TABLE public.artwork_categories TO authenticated;
GRANT ALL ON TABLE public.artwork_tags TO authenticated;
GRANT ALL ON TABLE public.categories TO authenticated;
GRANT ALL ON TABLE public.tags TO authenticated;

-- Ensure service_role has full access too
GRANT ALL ON TABLE public.artworks TO service_role;
GRANT ALL ON TABLE public.artwork_categories TO service_role;
GRANT ALL ON TABLE public.artwork_tags TO service_role;
GRANT ALL ON TABLE public.categories TO service_role;
GRANT ALL ON TABLE public.tags TO service_role;
