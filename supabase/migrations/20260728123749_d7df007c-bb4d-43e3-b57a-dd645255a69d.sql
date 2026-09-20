UPDATE public.artworks
SET seo_description = left(
  title || ': ' ||
  btrim(regexp_replace(regexp_replace(seo_description, '^Primeiramente\s*,?\s*', '', 'i'), '\s+', ' ', 'g')),
  158)
WHERE seo_description IS NOT NULL
  AND position(title in seo_description) = 0;