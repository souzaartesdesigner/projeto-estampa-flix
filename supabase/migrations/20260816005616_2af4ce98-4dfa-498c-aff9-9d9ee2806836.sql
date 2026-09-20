
-- Garantir permissões básicas para o papel anon
GRANT SELECT ON public.reviews TO anon;
GRANT EXECUTE ON FUNCTION public.review_author_names(uuid[]) TO anon;

-- Reforçar a política de visualização pública se ela não estiver correta
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
CREATE POLICY "Anyone can view approved reviews" ON public.reviews
FOR SELECT TO anon, authenticated
USING (is_approved = true OR auth.uid() = user_id);

-- Garantir que a tabela profiles NÃO tenha leitura pública
DROP POLICY IF EXISTS "profiles_public_read_policy" ON public.profiles;

-- Verificar se a função review_author_names está correta
CREATE OR REPLACE FUNCTION public.review_author_names(_ids uuid[])
 RETURNS TABLE(id uuid, full_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.id, p.full_name FROM public.profiles p WHERE p.id = ANY(_ids);
$function$;
