ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS author_name text;

UPDATE public.reviews r SET author_name = p.full_name
FROM public.profiles p WHERE p.id = r.user_id AND r.author_name IS NULL;

CREATE OR REPLACE FUNCTION public.tg_reviews_prepare()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.is_verified := public.has_purchased_or_downloaded(NEW.user_id, NEW.artwork_id);
  SELECT p.full_name INTO NEW.author_name FROM public.profiles p WHERE p.id = NEW.user_id;
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_approved := false;
    ELSIF NEW.rating IS DISTINCT FROM OLD.rating OR NEW.comment IS DISTINCT FROM OLD.comment THEN
      NEW.is_approved := false;
    END IF;
  END IF;
  RETURN NEW;
END; $function$;

DROP FUNCTION IF EXISTS public.review_author_names(uuid[]);