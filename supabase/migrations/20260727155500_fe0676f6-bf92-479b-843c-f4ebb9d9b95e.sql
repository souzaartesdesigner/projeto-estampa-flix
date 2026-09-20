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