REVOKE ALL ON FUNCTION public.tg_reviews_prepare() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.admin_get_artwork_external_url(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_artwork_external_url(uuid) TO authenticated;