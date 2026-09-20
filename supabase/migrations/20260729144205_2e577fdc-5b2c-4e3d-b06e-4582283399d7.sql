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