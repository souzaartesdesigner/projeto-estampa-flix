-- Desabilitar triggers temporariamente para evitar overhead
SET session_replication_role = 'replica';

-- Limpar tabelas de relacionamento e dados dependentes
TRUNCATE TABLE public.artwork_categories CASCADE;
TRUNCATE TABLE public.artwork_tags CASCADE;
TRUNCATE TABLE public.reviews CASCADE;
TRUNCATE TABLE public.downloads CASCADE;
TRUNCATE TABLE public.cart_items CASCADE;
TRUNCATE TABLE public.favorites CASCADE;

-- Limpar tabelas principais
TRUNCATE TABLE public.artworks CASCADE;
TRUNCATE TABLE public.categories CASCADE;
TRUNCATE TABLE public.tags CASCADE;

-- Restaurar triggers
SET session_replication_role = 'origin';