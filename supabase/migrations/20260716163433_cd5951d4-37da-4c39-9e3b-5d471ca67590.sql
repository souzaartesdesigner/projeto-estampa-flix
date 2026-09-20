
ALTER TABLE public.artworks ADD COLUMN IF NOT EXISTS external_url text;
ALTER TABLE public.artworks ALTER COLUMN file_path DROP NOT NULL;

DROP FUNCTION IF EXISTS public.consume_download(uuid);

CREATE OR REPLACE FUNCTION public.consume_download(_artwork_id uuid)
 RETURNS TABLE(file_path text, external_url text, credits_remaining integer, was_new boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    RETURN QUERY SELECT v_art.file_path, v_art.external_url, COALESCE((SELECT s.credits_remaining FROM public.subscriptions s WHERE s.user_id=v_uid AND s.status='active'),0), false;
    RETURN;
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE user_id = v_uid AND artwork_id = _artwork_id AND status = 'paid' LIMIT 1;
  IF FOUND THEN
    INSERT INTO public.downloads(user_id, artwork_id, source) VALUES (v_uid, _artwork_id, 'order');
    UPDATE public.artworks SET download_count = download_count + 1 WHERE id = _artwork_id;
    RETURN QUERY SELECT v_art.file_path, v_art.external_url, COALESCE((SELECT s.credits_remaining FROM public.subscriptions s WHERE s.user_id=v_uid AND s.status='active'),0), true;
    RETURN;
  END IF;

  SELECT * INTO v_sub FROM public.subscriptions WHERE user_id = v_uid AND status = 'active' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'no_active_subscription'; END IF;
  IF v_sub.current_period_end < now() THEN RAISE EXCEPTION 'subscription_expired'; END IF;
  IF v_sub.credits_remaining <= 0 THEN RAISE EXCEPTION 'no_credits'; END IF;

  UPDATE public.subscriptions SET credits_remaining = credits_remaining - 1 WHERE id = v_sub.id;
  INSERT INTO public.downloads(user_id, artwork_id, source) VALUES (v_uid, _artwork_id, 'subscription');
  UPDATE public.artworks SET download_count = download_count + 1 WHERE id = _artwork_id;

  RETURN QUERY SELECT v_art.file_path, v_art.external_url, v_sub.credits_remaining - 1, true;
END; $function$;
