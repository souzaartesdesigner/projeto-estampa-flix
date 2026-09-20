REVOKE SELECT ON public.site_settings FROM authenticated;
GRANT SELECT (
  blog_seo_description, blog_seo_keyword, blog_seo_title, body_scripts, facebook_url,
  favicon_url, footer_text, ga4_measurement_id, google_ads_id, google_ads_purchase_label,
  google_search_console_id, head_scripts, home_og_image_url, home_seo_description,
  home_seo_title, id, instagram_url, legal_business_name, legal_document, logo_url,
  meta_pixel_id, og_description, og_image_url, og_title, plans_seo_description,
  plans_seo_keyword, plans_seo_title, primary_color, promo_banner_enabled,
  promo_banner_link, promo_banner_text, robots_txt, seo_description, seo_keywords,
  seo_title, site_name, sitemap_enabled, sitemap_extra_paths, support_email, tagline,
  tiktok_url, updated_at, whatsapp, whatsapp_message
) ON public.site_settings TO authenticated;