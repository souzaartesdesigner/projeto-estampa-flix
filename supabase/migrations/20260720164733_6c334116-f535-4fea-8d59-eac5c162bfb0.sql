
-- =========================================
-- 1. SITE SETTINGS (singleton)
-- =========================================
CREATE TABLE public.site_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  -- Identity
  site_name text NOT NULL DEFAULT 'EstampaHub',
  tagline text DEFAULT 'Artes digitais para sublimação',
  logo_url text,
  favicon_url text,
  primary_color text DEFAULT '#007bff',
  -- Contact
  support_email text,
  whatsapp text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  -- SEO / Analytics
  ga4_measurement_id text,
  meta_pixel_id text,
  google_search_console_id text,
  -- Footer
  footer_text text,
  legal_business_name text,
  legal_document text,
  -- Top promo banner
  promo_banner_enabled boolean NOT NULL DEFAULT false,
  promo_banner_text text,
  promo_banner_link text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings_read_all" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings_admin_write" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tg_site_settings_updated BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
INSERT INTO public.site_settings (id) VALUES (true) ON CONFLICT DO NOTHING;

-- =========================================
-- 2. BANNERS
-- =========================================
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text NOT NULL,
  link_url text,
  cta_label text,
  position text NOT NULL DEFAULT 'home_hero' CHECK (position IN ('home_hero','home_middle','catalog_top')),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.banners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banners_read_active" ON public.banners FOR SELECT USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));
CREATE POLICY "banners_admin_read_all" ON public.banners FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "banners_admin_write" ON public.banners FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER tg_banners_updated BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- =========================================
-- 3. HOME SECTIONS
-- =========================================
CREATE TABLE public.home_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  section_type text NOT NULL CHECK (section_type IN ('featured','popular','new','category','manual')),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  item_limit integer NOT NULL DEFAULT 8,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.home_sections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.home_sections TO authenticated;
GRANT ALL ON public.home_sections TO service_role;
ALTER TABLE public.home_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "home_sections_read_active" ON public.home_sections FOR SELECT USING (is_active = true);
CREATE POLICY "home_sections_admin_read_all" ON public.home_sections FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "home_sections_admin_write" ON public.home_sections FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER tg_home_sections_updated BEFORE UPDATE ON public.home_sections FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- Seed default sections
INSERT INTO public.home_sections (title, section_type, sort_order) VALUES
 ('Em destaque', 'featured', 1),
 ('Mais populares', 'popular', 2),
 ('Novidades', 'new', 3);

-- =========================================
-- 4. ARTWORKS: is_featured + featured_order (if not exist)
-- =========================================
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS featured_order integer NOT NULL DEFAULT 0;

-- =========================================
-- 5. EMAIL LOGS
-- =========================================
CREATE TABLE public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  template text NOT NULL,
  subject text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed','suppressed')),
  provider_message_id text,
  error text,
  related_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  related_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  payload jsonb,
  sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_logs_admin_read" ON public.email_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_email_logs_order ON public.email_logs(related_order_id);
CREATE INDEX idx_email_logs_user ON public.email_logs(related_user_id);
CREATE INDEX idx_email_logs_created ON public.email_logs(created_at DESC);

-- =========================================
-- 6. SUPPORT MESSAGES: status/assign/reply
-- =========================================
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed'));
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS admin_reply text;
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS replied_at timestamptz;
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS replied_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
