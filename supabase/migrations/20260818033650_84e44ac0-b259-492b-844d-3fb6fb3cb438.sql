CREATE OR REPLACE FUNCTION public.grant_order_downloads(_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item jsonb;
  v_art_id uuid;
BEGIN
  -- Only admins (or trusted server-side/service_role callers with no auth context) may run this
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = _order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;

  IF v_order.status <> 'paid' THEN RAISE EXCEPTION 'order_not_paid'; END IF;

  IF v_order.items IS NOT NULL AND jsonb_array_length(v_order.items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_order.items)
    LOOP
      v_art_id := (v_item->>'artwork_id')::uuid;
      INSERT INTO public.downloads (user_id, artwork_id, source, last_downloaded_at)
      VALUES (v_order.user_id, v_art_id, 'order', now())
      ON CONFLICT (user_id, artwork_id) DO UPDATE SET last_downloaded_at = now();

      UPDATE public.artworks SET download_count = download_count + 1 WHERE id = v_art_id;
    END LOOP;
  ELSIF v_order.artwork_id IS NOT NULL THEN
    INSERT INTO public.downloads (user_id, artwork_id, source, last_downloaded_at)
    VALUES (v_order.user_id, v_order.artwork_id, 'order', now())
    ON CONFLICT (user_id, artwork_id) DO UPDATE SET last_downloaded_at = now();

    UPDATE public.artworks SET download_count = download_count + 1 WHERE id = v_order.artwork_id;
  END IF;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.has_purchased_or_downloaded(uuid, uuid) FROM authenticated;

CREATE OR REPLACE FUNCTION public.admin_get_artwork_external_url(_artwork_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_url text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  SELECT external_url INTO v_url FROM public.artworks WHERE id = _artwork_id;
  RETURN v_url;
END;
$function$;