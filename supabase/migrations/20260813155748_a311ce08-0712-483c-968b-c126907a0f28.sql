-- Limpeza total do catálogo para importação definitiva
-- Truncate cascade apaga os dados e limpa as tabelas relacionadas

-- Desabilita triggers temporariamente para evitar overhead se houver muitos dados, 
-- embora TRUNCATE CASCADE já lide com integridade referencial.

TRUNCATE TABLE public.artwork_categories CASCADE;
TRUNCATE TABLE public.artwork_tags CASCADE;
TRUNCATE TABLE public.reviews CASCADE;
TRUNCATE TABLE public.downloads CASCADE;
TRUNCATE TABLE public.cart_items CASCADE;
TRUNCATE TABLE public.favorites CASCADE;

-- Tabelas principais
TRUNCATE TABLE public.artworks CASCADE;
TRUNCATE TABLE public.categories CASCADE;
TRUNCATE TABLE public.tags CASCADE;

-- Reiniciar sequências se existirem (opcional, mas boa prática para "Clean Slate")
-- Nota: Se usar UUIDs, não há sequências para reiniciar nas PKs, 
-- mas algumas tabelas podem ter IDs seriais ocultos ou colunas de ordem.

-- Grant explícito para garantir que as tabelas continuem acessíveis após a limpeza
-- (Embora TRUNCATE não remova as tabelas, é bom reafirmar os privilégios se houver qualquer dúvida de estado)

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
