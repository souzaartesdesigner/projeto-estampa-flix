GRANT SELECT ON public.artworks TO anon;
GRANT SELECT ON public.artworks TO authenticated;
GRANT ALL ON public.artworks TO service_role;

-- Garantir acesso às tabelas relacionadas também
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT SELECT ON public.artwork_categories TO anon, authenticated;
GRANT SELECT ON public.artwork_tags TO anon, authenticated;
GRANT SELECT ON public.tags TO anon, authenticated;