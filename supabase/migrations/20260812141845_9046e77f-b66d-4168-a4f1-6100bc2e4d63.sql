ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS home_seo_title TEXT,
ADD COLUMN IF NOT EXISTS home_seo_description TEXT,
ADD COLUMN IF NOT EXISTS home_og_image_url TEXT,
ADD COLUMN IF NOT EXISTS plans_seo_title TEXT,
ADD COLUMN IF NOT EXISTS plans_seo_description TEXT,
ADD COLUMN IF NOT EXISTS plans_seo_keyword TEXT;

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
