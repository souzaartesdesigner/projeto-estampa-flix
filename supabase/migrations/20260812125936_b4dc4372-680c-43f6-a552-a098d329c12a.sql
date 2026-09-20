-- 1) Consolidate redundant SELECT policies on reviews
DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
DROP POLICY IF EXISTS "reviews_owner_select" ON public.reviews;

CREATE POLICY "reviews_select_visible" ON public.reviews
FOR SELECT
TO anon, authenticated
USING (
  is_approved = true
  OR auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- 2) email_logs: writes are service-role only; admins may read
REVOKE ALL ON public.email_logs FROM anon, authenticated;
GRANT SELECT ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;