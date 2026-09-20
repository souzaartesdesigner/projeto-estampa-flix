-- ============ CART ============
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artwork_id uuid NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, artwork_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own cart" ON public.cart_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ FAVORITES ============
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artwork_id uuid NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, artwork_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own favorites" ON public.favorites FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ COUPONS ============
CREATE TYPE public.coupon_discount_type AS ENUM ('percent', 'fixed');
CREATE TYPE public.coupon_scope AS ENUM ('subscription', 'pix', 'both');

CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type public.coupon_discount_type NOT NULL,
  discount_value integer NOT NULL CHECK (discount_value > 0),
  scope public.coupon_scope NOT NULL DEFAULT 'both',
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  once_per_user boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  stripe_coupon_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read active coupons" ON public.coupons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage coupons" ON public.coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER coupons_touch BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- ============ COUPON REDEMPTIONS ============
CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  discount_cents integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.coupon_redemptions TO authenticated;
GRANT ALL ON public.coupon_redemptions TO service_role;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own redemptions read" ON public.coupon_redemptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own redemptions insert" ON public.coupon_redemptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============ ORDERS: multi-item + coupon ============
ALTER TABLE public.orders ADD COLUMN items jsonb;
ALTER TABLE public.orders ADD COLUMN coupon_code text;
ALTER TABLE public.orders ADD COLUMN discount_cents integer NOT NULL DEFAULT 0;
ALTER TABLE public.orders ALTER COLUMN artwork_id DROP NOT NULL;

-- ============ FUNCTIONS ============

-- Grant downloads to all items in a paid order
CREATE OR REPLACE FUNCTION public.grant_order_downloads(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item jsonb;
  v_art_id uuid;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = _order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
  IF v_order.status <> 'paid' THEN RAISE EXCEPTION 'order_not_paid'; END IF;

  -- Multi-item order
  IF v_order.items IS NOT NULL AND jsonb_array_length(v_order.items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_order.items)
    LOOP
      v_art_id := (v_item->>'artwork_id')::uuid;
      INSERT INTO public.downloads (user_id, artwork_id, source)
      VALUES (v_order.user_id, v_art_id, 'order')
      ON CONFLICT (user_id, artwork_id) DO NOTHING;
      UPDATE public.artworks SET download_count = download_count + 1 WHERE id = v_art_id;
    END LOOP;
  ELSIF v_order.artwork_id IS NOT NULL THEN
    -- Legacy single-item order
    INSERT INTO public.downloads (user_id, artwork_id, source)
    VALUES (v_order.user_id, v_order.artwork_id, 'order')
    ON CONFLICT (user_id, artwork_id) DO NOTHING;
    UPDATE public.artworks SET download_count = download_count + 1 WHERE id = v_order.artwork_id;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.grant_order_downloads(uuid) FROM PUBLIC, anon, authenticated;

-- Validate coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _scope text, _subtotal_cents integer)
RETURNS TABLE(valid boolean, coupon_id uuid, discount_cents integer, message text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_c public.coupons%ROWTYPE;
  v_disc integer := 0;
  v_used int;
BEGIN
  IF v_uid IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, 0, 'not_authenticated'::text; RETURN;
  END IF;
  SELECT * INTO v_c FROM public.coupons WHERE lower(code) = lower(_code) AND active = true;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, 0, 'invalid_code'::text; RETURN;
  END IF;
  IF v_c.expires_at IS NOT NULL AND v_c.expires_at < now() THEN
    RETURN QUERY SELECT false, v_c.id, 0, 'expired'::text; RETURN;
  END IF;
  IF v_c.max_uses IS NOT NULL AND v_c.uses_count >= v_c.max_uses THEN
    RETURN QUERY SELECT false, v_c.id, 0, 'exhausted'::text; RETURN;
  END IF;
  IF v_c.scope <> 'both' AND v_c.scope::text <> _scope THEN
    RETURN QUERY SELECT false, v_c.id, 0, 'wrong_scope'::text; RETURN;
  END IF;
  IF v_c.once_per_user THEN
    SELECT COUNT(*) INTO v_used FROM public.coupon_redemptions WHERE coupon_id = v_c.id AND user_id = v_uid;
    IF v_used > 0 THEN
      RETURN QUERY SELECT false, v_c.id, 0, 'already_used'::text; RETURN;
    END IF;
  END IF;

  IF v_c.discount_type = 'percent' THEN
    v_disc := (_subtotal_cents * v_c.discount_value) / 100;
  ELSE
    v_disc := v_c.discount_value;
  END IF;
  IF v_disc > _subtotal_cents THEN v_disc := _subtotal_cents; END IF;

  RETURN QUERY SELECT true, v_c.id, v_disc, 'ok'::text;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_coupon(text, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, text, integer) TO authenticated;


-- 1) Artworks gallery + translations
ALTER TABLE public.artworks
  ADD COLUMN IF NOT EXISTS gallery_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS translations jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS translations jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS translations jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2) has_purchased_or_downloaded helper
CREATE OR REPLACE FUNCTION public.has_purchased_or_downloaded(_user_id uuid, _artwork_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.downloads WHERE user_id = _user_id AND artwork_id = _artwork_id
  ) OR EXISTS (
    SELECT 1 FROM public.orders WHERE user_id = _user_id AND status = 'paid' AND (
      artwork_id = _artwork_id
      OR items @> jsonb_build_array(jsonb_build_object('artwork_id', _artwork_id::text))
    )
  );
$$;
REVOKE ALL ON FUNCTION public.has_purchased_or_downloaded(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_purchased_or_downloaded(uuid, uuid) TO authenticated, service_role;

-- 3) Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artwork_id uuid NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  is_approved boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, artwork_id)
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_public_read" ON public.reviews
  FOR SELECT TO anon, authenticated USING (is_approved = true);
CREATE POLICY "reviews_owner_insert" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.has_purchased_or_downloaded(auth.uid(), artwork_id)
  );
CREATE POLICY "reviews_owner_update" ON public.reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_owner_or_admin_delete" ON public.reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "reviews_admin_all" ON public.reviews
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_reviews_artwork ON public.reviews(artwork_id) WHERE is_approved = true;

-- 4) Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  link text,
  kind text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_owner_read" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_owner_update" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_owner_delete" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_admin_insert" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, created_at DESC) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON public.notifications(user_id, created_at DESC);

DROP POLICY IF EXISTS "Read active coupons" ON public.coupons;

CREATE POLICY "Read active coupons"
ON public.coupons
FOR SELECT
TO authenticated
USING (
  active = true
  AND (expires_at IS NULL OR expires_at > now())
);


-- Add phone to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- Add order_number (auto-increment, human friendly) to orders
CREATE SEQUENCE IF NOT EXISTS public.orders_order_number_seq START 1000;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number bigint UNIQUE;
ALTER TABLE public.orders ALTER COLUMN order_number SET DEFAULT nextval('public.orders_order_number_seq');
GRANT USAGE, SELECT ON SEQUENCE public.orders_order_number_seq TO authenticated, service_role;

-- Backfill existing orders
UPDATE public.orders SET order_number = nextval('public.orders_order_number_seq') WHERE order_number IS NULL;
ALTER TABLE public.orders ALTER COLUMN order_number SET NOT NULL;

-- Admin cancel/refund helper: allow admin to update order status/refund note
-- (Already covered by "Admin manage orders" policy)


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

CREATE TABLE public.home_section_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id uuid NOT NULL REFERENCES public.home_sections(id) ON DELETE CASCADE,
  artwork_id uuid NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(section_id, artwork_id)
);
GRANT SELECT ON public.home_section_items TO anon, authenticated;
GRANT ALL ON public.home_section_items TO service_role;
ALTER TABLE public.home_section_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read section items" ON public.home_section_items FOR SELECT USING (true);
CREATE POLICY "Admins manage section items" ON public.home_section_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_home_section_items_section ON public.home_section_items(section_id, sort_order);

UPDATE public.site_settings SET site_name = 'Estampa Flix', logo_url = '/__l5e/assets-v1/803758df-7757-44c9-8c71-26e110368b12/estampa-flix-logo.png' WHERE id = true;

ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS translations jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.artwork_categories (
  artwork_id uuid NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (artwork_id, category_id)
);

GRANT SELECT ON public.artwork_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artwork_categories TO authenticated;
GRANT ALL ON public.artwork_categories TO service_role;

ALTER TABLE public.artwork_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artwork categories public read" ON public.artwork_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Artwork categories admin write" ON public.artwork_categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS artwork_categories_category_idx ON public.artwork_categories(category_id);

INSERT INTO public.artwork_categories (artwork_id, category_id)
SELECT id, category_id FROM public.artworks WHERE category_id IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE public.artworks
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keyword text;

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

UPDATE public.artworks
SET seo_description = left(
  title || ': ' ||
  btrim(regexp_replace(regexp_replace(seo_description, '^Primeiramente\s*,?\s*', '', 'i'), '\s+', ' ', 'g')),
  158)
WHERE seo_description IS NOT NULL
  AND position(title in seo_description) = 0;

UPDATE public.artworks
SET seo_title = btrim(regexp_replace(seo_title, '\s*[—-]\s*(E|Es|Est|Esta|Estam|Estamp|Estampa|Estampa F.*)?$', '', 'i'))
WHERE seo_title IS NOT NULL;

UPDATE public.artworks
SET seo_description = btrim(regexp_replace(left(seo_description, 155), '[\s,;:.-]*\S*$', '')) || '…'
WHERE seo_description IS NOT NULL AND length(seo_description) > 150;

ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS product_code text GENERATED ALWAYS AS (upper(left(id::text, 8))) STORED;
CREATE INDEX IF NOT EXISTS artworks_product_code_idx ON public.artworks (product_code);

REVOKE SELECT (external_url) ON public.artworks FROM anon;
REVOKE SELECT (external_url) ON public.artworks FROM authenticated;

CREATE OR REPLACE FUNCTION public.admin_get_artwork_external_url(_artwork_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_url text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  SELECT external_url INTO v_url FROM public.artworks WHERE id = _artwork_id;
  RETURN v_url;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_artwork_external_url(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_artwork_external_url(uuid) TO authenticated;

REVOKE SELECT ON public.artworks FROM anon;
REVOKE SELECT ON public.artworks FROM authenticated;

GRANT SELECT (id, slug, title, description, category_id, preview_url, file_path, file_format, colors, price_cents, is_published, is_featured, is_trending, download_count, view_count, created_at, updated_at, credit_cost, gallery_urls, translations, featured_order, seo_title, seo_description, seo_keyword, product_code) ON public.artworks TO anon;

GRANT SELECT (id, slug, title, description, category_id, preview_url, file_path, file_format, colors, price_cents, is_published, is_featured, is_trending, download_count, view_count, created_at, updated_at, credit_cost, gallery_urls, translations, featured_order, seo_title, seo_description, seo_keyword, product_code) ON public.artworks TO authenticated;

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.tg_reviews_prepare()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.is_verified := public.has_purchased_or_downloaded(NEW.user_id, NEW.artwork_id);
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_approved := false;
    ELSIF NEW.rating IS DISTINCT FROM OLD.rating OR NEW.comment IS DISTINCT FROM OLD.comment THEN
      NEW.is_approved := false;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS reviews_prepare ON public.reviews;
CREATE TRIGGER reviews_prepare BEFORE INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.tg_reviews_prepare();

DROP POLICY IF EXISTS reviews_owner_insert ON public.reviews;
CREATE POLICY reviews_owner_insert ON public.reviews FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS reviews_owner_select ON public.reviews;
CREATE POLICY reviews_owner_select ON public.reviews FOR SELECT TO authenticated
USING (auth.uid() = user_id);

REVOKE ALL ON FUNCTION public.tg_reviews_prepare() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.admin_get_artwork_external_url(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_get_artwork_external_url(uuid) TO authenticated;

ALTER TABLE public.home_sections ADD COLUMN IF NOT EXISTS subtitle text;