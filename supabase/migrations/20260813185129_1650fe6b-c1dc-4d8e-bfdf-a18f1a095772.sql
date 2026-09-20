DROP POLICY IF EXISTS "product_images_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "product_images_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "product_images_delete_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "product-images insert" ON storage.objects;
DROP POLICY IF EXISTS "product-images update" ON storage.objects;
DROP POLICY IF EXISTS "product-images delete" ON storage.objects;

CREATE POLICY "product_images_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "product_images_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "product_images_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));