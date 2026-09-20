-- Harden site_settings: anon should only be able to read known-public columns.
REVOKE ALL ON TABLE public.site_settings FROM anon;
GRANT SELECT (
  id, site_name, tagline, logo_url, favicon_url, primary_color, support_email,
  whatsapp, whatsapp_message, instagram_url, facebook_url, tiktok_url,
  ga4_measurement_id, meta_pixel_id, google_search_console_id, google_ads_id,
  google_ads_purchase_label, footer_text, legal_business_name, legal_document,
  promo_banner_enabled, promo_banner_text, promo_banner_link, updated_at,
  seo_title, seo_description, seo_keywords, og_title, og_description,
  og_image_url, head_scripts, body_scripts, robots_txt, sitemap_enabled,
  sitemap_extra_paths, home_seo_title, home_seo_description, home_og_image_url,
  plans_seo_title, plans_seo_description, plans_seo_keyword,
  blog_seo_title, blog_seo_description, blog_seo_keyword
) ON public.site_settings TO anon;

-- Restrict the permissive public SELECT policy to the API roles only.
DROP POLICY IF EXISTS site_settings_read_all ON public.site_settings;
CREATE POLICY site_settings_read_public ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);

-- email_logs: writes must stay server-side (service role) only.
REVOKE ALL ON TABLE public.email_logs FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.email_logs FROM authenticated;
GRANT SELECT ON TABLE public.email_logs TO authenticated;
GRANT ALL ON TABLE public.email_logs TO service_role;