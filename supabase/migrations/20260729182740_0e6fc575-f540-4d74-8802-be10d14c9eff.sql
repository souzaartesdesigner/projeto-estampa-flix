ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keywords text,
  ADD COLUMN IF NOT EXISTS og_title text,
  ADD COLUMN IF NOT EXISTS og_description text,
  ADD COLUMN IF NOT EXISTS og_image_url text,
  ADD COLUMN IF NOT EXISTS head_scripts text,
  ADD COLUMN IF NOT EXISTS robots_txt text,
  ADD COLUMN IF NOT EXISTS sitemap_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sitemap_extra_paths text;

ALTER TABLE public.artworks
  ADD COLUMN IF NOT EXISTS alt_text text,
  ADD COLUMN IF NOT EXISTS noindex boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tech_specs text,
  ADD COLUMN IF NOT EXISTS resolution text,
  ADD COLUMN IF NOT EXISTS dimensions text,
  ADD COLUMN IF NOT EXISTS usage_instructions text,
  ADD COLUMN IF NOT EXISTS license_text text;

CREATE TABLE IF NOT EXISTS public.site_content (
  key text PRIMARY KEY,
  title text,
  content text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_content_public_read" ON public.site_content
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "site_content_admin_write" ON public.site_content
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();