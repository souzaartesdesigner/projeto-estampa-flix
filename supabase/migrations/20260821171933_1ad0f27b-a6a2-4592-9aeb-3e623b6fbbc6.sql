REVOKE EXECUTE ON FUNCTION public.grant_order_downloads(uuid) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_get_artwork_external_url(uuid) FROM authenticated, anon, PUBLIC;
REVOKE SELECT (external_url) ON public.artworks FROM anon, authenticated;