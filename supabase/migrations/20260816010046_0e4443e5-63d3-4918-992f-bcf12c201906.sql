
-- Garantir permissões de execução e leitura para anon e authenticated em tudo que for necessário para reviews
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_author_names(uuid[]) TO anon, authenticated;
GRANT SELECT ON public.reviews TO anon, authenticated;

-- Garantir que a política de visualização de reviews aprovados seja robusta
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
CREATE POLICY "Anyone can view approved reviews" ON public.reviews
FOR SELECT TO anon, authenticated
USING (is_approved = true OR (auth.uid() IS NOT NULL AND auth.uid() = user_id));
