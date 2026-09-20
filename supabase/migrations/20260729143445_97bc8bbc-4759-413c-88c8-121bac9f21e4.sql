REVOKE SELECT (external_url) ON public.artworks FROM anon;
REVOKE SELECT (external_url) ON public.artworks FROM authenticated;

CREATE OR REPLACE FUNCTION public.admin_get_artwork_external_url(_artwork_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_url text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  SELECT external_url INTO v_url FROM public.artworks WHERE id = _artwork_id;
  RETURN v_url;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_artwork_external_url(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_artwork_external_url(uuid) TO authenticated;