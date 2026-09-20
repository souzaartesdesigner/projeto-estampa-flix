-- Garantir que a RLS de downloads esteja correta
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own downloads" ON public.downloads;
CREATE POLICY "Users can view own downloads" ON public.downloads
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Reforçar a função grant_order_downloads para evitar qualquer ambiguidade
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
  -- Seleciona o pedido
  SELECT * INTO v_order FROM public.orders WHERE id = _order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;
  
  -- Só processa se estiver pago
  IF v_order.status <> 'paid' THEN RAISE EXCEPTION 'order_not_paid'; END IF;

  -- Multi-item order
  IF v_order.items IS NOT NULL AND jsonb_array_length(v_order.items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_order.items)
    LOOP
      v_art_id := (v_item->>'artwork_id')::uuid;
      -- Insere explicitamente para o user_id do pedido
      INSERT INTO public.downloads (user_id, artwork_id, source, last_downloaded_at)
      VALUES (v_order.user_id, v_art_id, 'order', now())
      ON CONFLICT (user_id, artwork_id) DO UPDATE SET last_downloaded_at = now();
      
      UPDATE public.artworks SET download_count = download_count + 1 WHERE id = v_art_id;
    END LOOP;
  ELSIF v_order.artwork_id IS NOT NULL THEN
    -- Legacy single-item order
    INSERT INTO public.downloads (user_id, artwork_id, source, last_downloaded_at)
    VALUES (v_order.user_id, v_order.artwork_id, 'order', now())
    ON CONFLICT (user_id, artwork_id) DO UPDATE SET last_downloaded_at = now();
    
    UPDATE public.artworks SET download_count = download_count + 1 WHERE id = v_order.artwork_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_order_downloads(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_order_downloads(uuid) TO service_role;
