DROP POLICY IF EXISTS "Read active coupons" ON public.coupons;

CREATE POLICY "Read active coupons"
ON public.coupons
FOR SELECT
TO authenticated
USING (
  active = true
  AND (expires_at IS NULL OR expires_at > now())
);