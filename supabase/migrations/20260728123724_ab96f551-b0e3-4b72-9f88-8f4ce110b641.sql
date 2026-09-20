UPDATE public.artworks a
SET
  seo_title = COALESCE(NULLIF(btrim(a.seo_title), ''), left(a.title || ' — Estampa Flix', 65)),
  seo_keyword = COALESCE(NULLIF(btrim(a.seo_keyword), ''), lower(a.title)),
  seo_description = COALESCE(
    NULLIF(btrim(a.seo_description), ''),
    left(
      NULLIF(
        btrim(regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(COALESCE(a.description, ''), '<[^>]+>', ' ', 'g'),
              'ATEN(Ç|C)(Ã|A)O:.*?download direto na sua conta\.?', ' ', 'gis'),
            '(\\n|&nbsp;)', ' ', 'gi'),
          '\s+', ' ', 'g')),
        ''),
      158)
  )
WHERE a.seo_title IS NULL OR a.seo_description IS NULL OR a.seo_keyword IS NULL;

UPDATE public.artworks
SET seo_description = left(title || ' — arte digital em alta resolução (300 DPI) para sublimação, DTF e estamparia, com licença comercial na Estampa Flix.', 158)
WHERE seo_description IS NULL OR length(btrim(seo_description)) < 50;