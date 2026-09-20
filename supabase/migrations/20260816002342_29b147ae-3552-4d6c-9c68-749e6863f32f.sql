-- Garantir acesso de leitura pública para avaliações aprovadas
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
CREATE POLICY "Anyone can view approved reviews" 
ON public.reviews 
FOR SELECT 
TO anon, authenticated
USING (is_approved = true OR auth.uid() = user_id);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT ON public.profiles TO anon;
