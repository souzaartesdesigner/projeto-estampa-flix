-- Adicionar colunas de SEO na tabela site_settings para a página do blog
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS blog_seo_title TEXT,
ADD COLUMN IF NOT EXISTS blog_seo_description TEXT,
ADD COLUMN IF NOT EXISTS blog_seo_keyword TEXT;

-- Adicionar colunas de SEO na tabela blog_posts para artigos individuais
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS seo_keyword TEXT,
ADD COLUMN IF NOT EXISTS cover_alt TEXT;

-- Garantir que as permissões estejam corretas
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
