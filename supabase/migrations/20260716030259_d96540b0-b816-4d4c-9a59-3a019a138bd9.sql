
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');
CREATE TYPE public.plan_tier AS ENUM ('lite', 'pro', 'plus');
CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');
CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE public.support_status AS ENUM ('new', 'in_progress', 'resolved');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Categories admin write" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ TAGS ============
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tags TO anon, authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tags public read" ON public.tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Tags admin write" ON public.tags FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ ARTWORKS ============
CREATE TABLE public.artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  preview_url TEXT NOT NULL,
  file_path TEXT NOT NULL, -- path in private storage bucket
  file_format TEXT, -- png, zip, rar, psd
  colors TEXT[] DEFAULT '{}',
  price_cents INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_trending BOOLEAN NOT NULL DEFAULT false,
  download_count INT NOT NULL DEFAULT 0,
  view_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.artworks TO anon, authenticated;
GRANT ALL ON public.artworks TO service_role;
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Artworks public read" ON public.artworks FOR SELECT TO anon, authenticated USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Artworks admin write" ON public.artworks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ ARTWORK ↔ TAGS ============
CREATE TABLE public.artwork_tags (
  artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (artwork_id, tag_id)
);
GRANT SELECT ON public.artwork_tags TO anon, authenticated;
GRANT ALL ON public.artwork_tags TO service_role;
ALTER TABLE public.artwork_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Artwork tags public read" ON public.artwork_tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Artwork tags admin write" ON public.artwork_tags FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ PLANS ============
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier plan_tier NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INT NOT NULL,
  monthly_credits INT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.plans TO anon, authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans public read" ON public.plans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Plans admin write" ON public.plans FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.plans (tier, name, description, price_cents, monthly_credits, features, sort_order) VALUES
  ('lite', 'Premium Lite', 'Ideal para começar. 10 downloads por mês.', 7990, 10,
    '["10 downloads mensais","Acesso a todo o catálogo","Novas artes toda semana","Uso comercial permitido"]'::jsonb, 1),
  ('pro',  'Premium Pro',  'Para quem produz em ritmo intenso. 20 downloads por mês.', 13590, 20,
    '["20 downloads mensais","Acesso a todo o catálogo","Coleções exclusivas","Uso comercial permitido","Suporte prioritário"]'::jsonb, 2),
  ('plus', 'Premium Plus', 'Nosso plano mais completo. 30 downloads por mês.', 17990, 30,
    '["30 downloads mensais","Acesso a todo o catálogo","Coleções exclusivas","Lançamentos antecipados","Uso comercial permitido","Suporte prioritário"]'::jsonb, 3);

-- ============ SUBSCRIPTIONS ============
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status subscription_status NOT NULL DEFAULT 'active',
  credits_remaining INT NOT NULL DEFAULT 0,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  stripe_subscription_id TEXT,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX subscriptions_active_per_user ON public.subscriptions (user_id) WHERE status = 'active';
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own subscription read" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage subscriptions" ON public.subscriptions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ ORDERS (compras avulsas) ============
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE RESTRICT,
  amount_cents INT NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);
CREATE INDEX orders_user_idx ON public.orders(user_id);
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own orders read" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage orders" ON public.orders FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ DOWNLOADS ============
CREATE TABLE public.downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artwork_id UUID NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'subscription', -- subscription | order
  first_downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  download_count INT NOT NULL DEFAULT 1,
  UNIQUE (user_id, artwork_id)
);
CREATE INDEX downloads_user_idx ON public.downloads(user_id);
GRANT SELECT ON public.downloads TO authenticated;
GRANT ALL ON public.downloads TO service_role;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own downloads read" ON public.downloads FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ============ BLOG ============
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT,
  cover_url TEXT,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'Equipe',
  is_published BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts public read" ON public.blog_posts FOR SELECT TO anon, authenticated USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Posts admin write" ON public.blog_posts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ SUPPORT ============
CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status support_status NOT NULL DEFAULT 'new',
  admin_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.support_messages TO anon, authenticated;
GRANT SELECT, UPDATE ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Support public insert" ON public.support_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Support admin read" ON public.support_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);
CREATE POLICY "Support admin update" ON public.support_messages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ TRIGGERS ============
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER t_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE TRIGGER t_artworks_updated BEFORE UPDATE ON public.artworks FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE TRIGGER t_subs_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE TRIGGER t_posts_updated BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
CREATE TRIGGER t_support_updated BEFORE UPDATE ON public.support_messages FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ DOWNLOAD RPC (RLS-safe, atomic) ============
-- Records a download and decrements credits if it's a new artwork for this user.
-- Returns file_path on success, or raises exception.
CREATE OR REPLACE FUNCTION public.consume_download(_artwork_id UUID)
RETURNS TABLE(file_path TEXT, credits_remaining INT, was_new BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_existing public.downloads%ROWTYPE;
  v_sub public.subscriptions%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_art public.artworks%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO v_art FROM public.artworks WHERE id = _artwork_id AND is_published = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'artwork_not_found'; END IF;

  SELECT * INTO v_existing FROM public.downloads WHERE user_id = v_uid AND artwork_id = _artwork_id;
  IF FOUND THEN
    UPDATE public.downloads SET last_downloaded_at = now(), download_count = download_count + 1
      WHERE user_id = v_uid AND artwork_id = _artwork_id;
    RETURN QUERY SELECT v_art.file_path, COALESCE((SELECT s.credits_remaining FROM public.subscriptions s WHERE s.user_id=v_uid AND s.status='active'),0), false;
    RETURN;
  END IF;

  -- Check if user owns via order
  SELECT * INTO v_order FROM public.orders WHERE user_id = v_uid AND artwork_id = _artwork_id AND status = 'paid' LIMIT 1;
  IF FOUND THEN
    INSERT INTO public.downloads(user_id, artwork_id, source) VALUES (v_uid, _artwork_id, 'order');
    UPDATE public.artworks SET download_count = download_count + 1 WHERE id = _artwork_id;
    RETURN QUERY SELECT v_art.file_path, COALESCE((SELECT s.credits_remaining FROM public.subscriptions s WHERE s.user_id=v_uid AND s.status='active'),0), true;
    RETURN;
  END IF;

  -- Use subscription credits
  SELECT * INTO v_sub FROM public.subscriptions WHERE user_id = v_uid AND status = 'active' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'no_active_subscription'; END IF;
  IF v_sub.current_period_end < now() THEN RAISE EXCEPTION 'subscription_expired'; END IF;
  IF v_sub.credits_remaining <= 0 THEN RAISE EXCEPTION 'no_credits'; END IF;

  UPDATE public.subscriptions SET credits_remaining = credits_remaining - 1 WHERE id = v_sub.id;
  INSERT INTO public.downloads(user_id, artwork_id, source) VALUES (v_uid, _artwork_id, 'subscription');
  UPDATE public.artworks SET download_count = download_count + 1 WHERE id = _artwork_id;

  RETURN QUERY SELECT v_art.file_path, v_sub.credits_remaining - 1, true;
END; $$;

GRANT EXECUTE ON FUNCTION public.consume_download(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated, anon;
