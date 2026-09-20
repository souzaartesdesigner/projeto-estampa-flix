DO $$
DECLARE cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
    INTO cols
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='artworks' AND column_name <> 'external_url';

  EXECUTE 'REVOKE SELECT ON public.artworks FROM anon';
  EXECUTE 'REVOKE SELECT ON public.artworks FROM authenticated';
  EXECUTE format('GRANT SELECT (%s) ON public.artworks TO anon', cols);
  EXECUTE format('GRANT SELECT (%s) ON public.artworks TO authenticated', cols);
END $$;

GRANT INSERT, UPDATE, DELETE ON public.artworks TO authenticated;
GRANT ALL ON public.artworks TO service_role;