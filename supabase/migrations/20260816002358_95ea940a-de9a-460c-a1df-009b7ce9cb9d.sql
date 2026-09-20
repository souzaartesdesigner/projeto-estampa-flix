-- Permissão de leitura pública para avaliações aprovadas
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
CREATE POLICY "Anyone can view approved reviews" 
ON public.reviews 
FOR SELECT 
TO anon, authenticated
USING (is_approved = true OR auth.uid() = user_id);

-- Garantir que a tabela profiles também permita leitura pública de nomes para as avaliações
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
TO anon, authenticated
USING (true);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT ON public.profiles TO anon;
