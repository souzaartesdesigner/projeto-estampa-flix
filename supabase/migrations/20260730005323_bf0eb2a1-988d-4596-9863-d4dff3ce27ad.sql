-- 1. license_type on artworks
ALTER TABLE public.artworks
  ADD COLUMN IF NOT EXISTS license_type TEXT NOT NULL DEFAULT 'premium';

ALTER TABLE public.artworks
  DROP CONSTRAINT IF EXISTS artworks_license_type_check;
ALTER TABLE public.artworks
  ADD CONSTRAINT artworks_license_type_check CHECK (license_type IN ('premium','free'));

CREATE INDEX IF NOT EXISTS artworks_license_type_idx ON public.artworks (license_type);

-- 2. daily_downloads
CREATE TABLE IF NOT EXISTS public.daily_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  artwork_id uuid NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  downloaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.daily_downloads TO authenticated;
GRANT ALL ON public.daily_downloads TO service_role;

ALTER TABLE public.daily_downloads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own daily downloads" ON public.daily_downloads;
CREATE POLICY "Users read own daily downloads"
  ON public.daily_downloads FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read all daily downloads" ON public.daily_downloads;
CREATE POLICY "Admins read all daily downloads"
  ON public.daily_downloads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS daily_downloads_user_date_idx
  ON public.daily_downloads (user_id, downloaded_at);

-- 3. helper: how many free downloads today
CREATE OR REPLACE FUNCTION public.free_downloads_today()
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*), 0)::int
  FROM public.daily_downloads
  WHERE user_id = auth.uid()
    AND downloaded_at >= date_trunc('day', now());
$$;

REVOKE ALL ON FUNCTION public.free_downloads_today() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.free_downloads_today() TO authenticated;

-- 4. consume_download with free-license rules
CREATE OR REPLACE FUNCTION public.consume_download(_artwork_id uuid)
 RETURNS TABLE(file_path text, external_url text, credits_remaining integer, was_new boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_uid UUID := auth.uid();
  v_existing public.downloads%ROWTYPE;
  v_sub public.subscriptions%ROWTYPE;
  v_order public.orders%ROWTYPE;
  v_art public.artworks%ROWTYPE;
  v_cost INTEGER;
  v_today INTEGER;
  v_has_sub BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO v_art FROM public.artworks WHERE id = _artwork_id AND is_published = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'artwork_not_found'; END IF;
  v_cost := COALESCE(v_art.credit_cost, 1);

  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = v_uid AND s.status = 'active' AND s.current_period_end >= now()
  ) INTO v_has_sub;

  -- FREE license artworks: authenticated only, 5/day unless active subscription
  IF v_art.license_type = 'free' THEN
    IF NOT v_has_sub THEN
      SELECT COUNT(*) INTO v_today FROM public.daily_downloads d
        WHERE d.user_id = v_uid AND d.downloaded_at >= date_trunc('day', now());
      IF v_today >= 5 AND NOT EXISTS (
        SELECT 1 FROM public.downloads dd WHERE dd.user_id = v_uid AND dd.artwork_id = _artwork_id
      ) THEN
        RAISE EXCEPTION 'daily_limit_reached';
      END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.downloads dd WHERE dd.user_id = v_uid AND dd.artwork_id = _artwork_id) THEN
      INSERT INTO public.downloads(user_id, artwork_id, source) VALUES (v_uid, _artwork_id, 'free');
      UPDATE public.artworks a SET download_count = a.download_count + 1 WHERE a.id = _artwork_id;
      IF NOT v_has_sub THEN
        INSERT INTO public.daily_downloads(user_id, artwork_id) VALUES (v_uid, _artwork_id);
      END IF;
      RETURN QUERY SELECT v_art.file_path, v_art.external_url,
        COALESCE((SELECT s.credits_remaining FROM public.subscriptions s WHERE s.user_id = v_uid AND s.status = 'active'), 0), true;
    ELSE
      UPDATE public.downloads d SET last_downloaded_at = now(), download_count = d.download_count + 1
        WHERE d.user_id = v_uid AND d.artwork_id = _artwork_id;
      RETURN QUERY SELECT v_art.file_path, v_art.external_url,
        COALESCE((SELECT s.credits_remaining FROM public.subscriptions s WHERE s.user_id = v_uid AND s.status = 'active'), 0), false;
    END IF;
    RETURN;
  END IF;

  SELECT * INTO v_existing FROM public.downloads d WHERE d.user_id = v_uid AND d.artwork_id = _artwork_id;
  IF FOUND THEN
    UPDATE public.downloads d SET last_downloaded_at = now(), download_count = d.download_count + 1
      WHERE d.user_id = v_uid AND d.artwork_id = _artwork_id;
    RETURN QUERY SELECT v_art.file_path, v_art.external_url,
      COALESCE((SELECT s.credits_remaining FROM public.subscriptions s WHERE s.user_id = v_uid AND s.status = 'active'), 0),
      false;
    RETURN;
  END IF;

  SELECT * INTO v_order FROM public.orders o WHERE o.user_id = v_uid AND o.artwork_id = _artwork_id AND o.status = 'paid' LIMIT 1;
  IF FOUND THEN
    INSERT INTO public.downloads(user_id, artwork_id, source) VALUES (v_uid, _artwork_id, 'order');
    UPDATE public.artworks a SET download_count = a.download_count + 1 WHERE a.id = _artwork_id;
    RETURN QUERY SELECT v_art.file_path, v_art.external_url,
      COALESCE((SELECT s.credits_remaining FROM public.subscriptions s WHERE s.user_id = v_uid AND s.status = 'active'), 0),
      true;
    RETURN;
  END IF;

  IF v_cost <= 0 THEN
    INSERT INTO public.downloads(user_id, artwork_id, source) VALUES (v_uid, _artwork_id, 'free');
    UPDATE public.artworks a SET download_count = a.download_count + 1 WHERE a.id = _artwork_id;
    RETURN QUERY SELECT v_art.file_path, v_art.external_url,
      COALESCE((SELECT s.credits_remaining FROM public.subscriptions s WHERE s.user_id = v_uid AND s.status = 'active'), 0),
      true;
    RETURN;
  END IF;

  SELECT * INTO v_sub FROM public.subscriptions s WHERE s.user_id = v_uid AND s.status = 'active' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'no_active_subscription'; END IF;
  IF v_sub.current_period_end < now() THEN RAISE EXCEPTION 'subscription_expired'; END IF;
  IF v_sub.credits_remaining < v_cost THEN RAISE EXCEPTION 'no_credits'; END IF;

  UPDATE public.subscriptions s SET credits_remaining = s.credits_remaining - v_cost WHERE s.id = v_sub.id;
  INSERT INTO public.downloads(user_id, artwork_id, source) VALUES (v_uid, _artwork_id, 'subscription');
  UPDATE public.artworks a SET download_count = a.download_count + 1 WHERE a.id = _artwork_id;

  RETURN QUERY SELECT v_art.file_path, v_art.external_url, v_sub.credits_remaining - v_cost, true;
END;
$function$;

REVOKE ALL ON FUNCTION public.consume_download(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_download(uuid) TO authenticated;