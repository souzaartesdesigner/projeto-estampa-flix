DROP POLICY IF EXISTS "reviews_select_visible" ON public.reviews;
CREATE POLICY "reviews_select_visible_auth" ON public.reviews
FOR SELECT TO authenticated
USING (is_approved = true OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
CREATE POLICY "reviews_select_approved_anon" ON public.reviews
FOR SELECT TO anon
USING (is_approved = true);