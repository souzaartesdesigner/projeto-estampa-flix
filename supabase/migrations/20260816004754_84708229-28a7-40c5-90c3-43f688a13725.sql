DROP VIEW IF EXISTS public.public_profiles;

CREATE OR REPLACE FUNCTION public.review_author_names(_ids uuid[])
RETURNS TABLE(id uuid, full_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name FROM public.profiles p WHERE p.id = ANY(_ids);
$$;

REVOKE ALL ON FUNCTION public.review_author_names(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_author_names(uuid[]) TO anon, authenticated;