
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
