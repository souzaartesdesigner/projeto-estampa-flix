REVOKE SELECT (file_path) ON public.artworks FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_get_artwork_file_path(_artwork_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_path text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  SELECT file_path INTO v_path FROM public.artworks WHERE id = _artwork_id;
  RETURN v_path;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_get_artwork_file_path(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_artwork_file_path(uuid) TO authenticated, service_role;