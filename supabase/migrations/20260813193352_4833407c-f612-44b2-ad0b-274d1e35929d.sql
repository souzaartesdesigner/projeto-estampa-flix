-- Script SQL para Limpeza Total (Wipe) do Catálogo
-- Este script remove todos os produtos, categorias, tags e relações, permitindo uma importação limpa.

-- 1. Desabilitar triggers temporariamente para evitar overhead se necessário (opcional no TRUNCATE)
-- 2. Executar TRUNCATE com CASCADE para limpar tabelas e suas dependências

TRUNCATE TABLE 
    public.artwork_categories,
    public.artwork_tags,
    public.artworks,
    public.categories,
    public.tags,
    public.reviews,
    public.favorites,
    public.cart_items,
    public.downloads,
    public.daily_downloads
CASCADE;

-- Opcional: Reiniciar sequências se houver IDs auto-incrementais numéricos (geralmente usamos UUIDs, mas por precaução)
-- ALTER SEQUENCE IF EXISTS artworks_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS categories_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS tags_id_seq RESTART WITH 1;

-- Nota: O CASCADE garante que se houver outras tabelas referenciando estas (como logs ou itens de pedido), 
-- elas também sejam limpas ou a restrição seja respeitada.
