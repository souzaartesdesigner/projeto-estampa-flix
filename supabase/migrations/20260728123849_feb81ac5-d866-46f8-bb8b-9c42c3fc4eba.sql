UPDATE public.artworks
SET seo_title = btrim(regexp_replace(seo_title, '\s*[—-]\s*(E|Es|Est|Esta|Estam|Estamp|Estampa|Estampa F.*)?$', '', 'i'))
WHERE seo_title IS NOT NULL;

UPDATE public.artworks
SET seo_description = btrim(regexp_replace(left(seo_description, 155), '[\s,;:.-]*\S*$', '')) || '…'
WHERE seo_description IS NOT NULL AND length(seo_description) > 150;