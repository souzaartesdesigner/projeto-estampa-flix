-- 1. Remover a coluna gerada e recriar como coluna regular TEXT UNIQUE
-- Nota: Usamos transação para garantir que a transição seja segura

-- Drop da coluna gerada existente
ALTER TABLE public.artworks DROP COLUMN IF EXISTS product_code;

-- Adição da coluna como TEXT regular
ALTER TABLE public.artworks ADD COLUMN product_code TEXT;

-- Garantir que a restrição UNIQUE exista
ALTER TABLE public.artworks ADD CONSTRAINT artworks_product_code_key UNIQUE (product_code);

-- Recriar índice para performance
CREATE INDEX IF NOT EXISTS artworks_product_code_idx ON public.artworks (product_code);
