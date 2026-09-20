-- Auditoria e Correção de Funções SECURITY DEFINER
-- O linter avisou que authenticated pode executar funções SECURITY DEFINER.
-- Devemos restringir a execução apenas aos papéis que realmente precisam.

-- 1. has_role (Usada para políticas, ok ser SECURITY DEFINER, mas restringir execução)
ALTER FUNCTION public.has_role(_user_id uuid, _role app_role) SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

-- 2. consume_download (Crítica: gerencia créditos)
ALTER FUNCTION public.consume_download(_artwork_id uuid) SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.consume_download(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.consume_download(uuid) TO authenticated, service_role;

-- 3. grant_order_downloads
ALTER FUNCTION public.grant_order_downloads(_order_id uuid) SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.grant_order_downloads(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.grant_order_downloads(uuid) TO authenticated, service_role;

-- 4. free_downloads_today
ALTER FUNCTION public.free_downloads_today() SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.free_downloads_today() FROM public;
GRANT EXECUTE ON FUNCTION public.free_downloads_today() TO authenticated, service_role;

-- 5. validate_coupon
ALTER FUNCTION public.validate_coupon(_code text, _scope text, _subtotal_cents integer) SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.validate_coupon(text, text, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, text, integer) TO authenticated, service_role;

-- 6. handle_new_user (Trigger de Auth, não deve ser chamada pelo público)
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM public;
-- Triggers de Auth rodam como service_role/postgres, então não precisam de GRANT public.
