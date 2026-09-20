
ALTER TABLE public.reviews 
DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;

ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.reviews TO anon, authenticated;
