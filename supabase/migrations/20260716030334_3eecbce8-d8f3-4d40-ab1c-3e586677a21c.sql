
REVOKE ALL ON FUNCTION public.has_role(UUID, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consume_download(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_touch_updated_at() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_download(UUID) TO authenticated;
