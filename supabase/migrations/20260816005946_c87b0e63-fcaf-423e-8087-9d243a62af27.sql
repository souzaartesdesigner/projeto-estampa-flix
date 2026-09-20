
-- Garantir que anon tenha acesso a reviews
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT ON public.reviews TO authenticated;

-- Garantir que RLS permita leitura pública
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
CREATE POLICY "Anyone can view approved reviews" ON public.reviews
FOR SELECT TO anon, authenticated
USING (is_approved = true OR auth.uid() = user_id);

-- Verificar se o bucket de previews também está acessível (SEO)
-- O linter avisou sobre buckets anteriormente
-- Mas vamos focar nos reviews primeiro.
