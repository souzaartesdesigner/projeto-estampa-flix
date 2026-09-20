REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;

CREATE OR REPLACE FUNCTION public.review_author_names(_ids uuid[])
RETURNS TABLE(id uuid, full_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p.id, p.full_name
  FROM public.profiles p
  WHERE p.id = ANY(_ids)
    AND EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.user_id = p.id AND r.is_approved = true
    );
$function$;

REVOKE EXECUTE ON FUNCTION public.review_author_names(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_author_names(uuid[]) TO anon, authenticated, service_role;