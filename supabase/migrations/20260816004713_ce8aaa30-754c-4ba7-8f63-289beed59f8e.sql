DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT id, full_name FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;