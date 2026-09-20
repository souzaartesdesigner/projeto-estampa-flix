CREATE TABLE public.home_section_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id uuid NOT NULL REFERENCES public.home_sections(id) ON DELETE CASCADE,
  artwork_id uuid NOT NULL REFERENCES public.artworks(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(section_id, artwork_id)
);
GRANT SELECT ON public.home_section_items TO anon, authenticated;
GRANT ALL ON public.home_section_items TO service_role;
ALTER TABLE public.home_section_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read section items" ON public.home_section_items FOR SELECT USING (true);
CREATE POLICY "Admins manage section items" ON public.home_section_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_home_section_items_section ON public.home_section_items(section_id, sort_order);