
-- O erro ocorre porque a política de reviews usa a função has_role(),
-- que não tem permissão de execução para o papel anon.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;

-- Garantir também permissão na tabela user_roles se has_role não for security definer
-- mas has_role é security definer conforme o histórico.
-- Vamos verificar se has_role é SECURITY DEFINER
SELECT 
    p.proname, p.prosecdef 
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'has_role';

-- Se não for security definer, precisamos ajustá-la para evitar recursão e permitir uso por anon
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      and role = _role
  )
$$;

-- E garantir execução
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
