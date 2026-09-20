REVOKE SELECT ON public.artworks FROM anon;
REVOKE SELECT ON public.artworks FROM authenticated;

GRANT SELECT (id, slug, title, description, category_id, preview_url, file_path, file_format, colors, price_cents, is_published, is_featured, is_trending, download_count, view_count, created_at, updated_at, credit_cost, gallery_urls, translations, featured_order, seo_title, seo_description, seo_keyword, product_code) ON public.artworks TO anon;

GRANT SELECT (id, slug, title, description, category_id, preview_url, file_path, file_format, colors, price_cents, is_published, is_featured, is_trending, download_count, view_count, created_at, updated_at, credit_cost, gallery_urls, translations, featured_order, seo_title, seo_description, seo_keyword, product_code) ON public.artworks TO authenticated;