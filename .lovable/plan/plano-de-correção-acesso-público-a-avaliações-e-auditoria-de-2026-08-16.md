# Plano de Correção: Acesso Público a Avaliações e Auditoria de Perfis

O objetivo deste plano é garantir que as avaliações de produtos sejam visíveis para usuários não logados (visitantes) e confirmar que a política de privacidade da tabela `profiles` está restringindo corretamente o acesso a dados sensíveis.

## Alterações Propostas

### 1. Banco de Dados (Segurança e RLS)
- **Verificação de Permissões:** Garantir que o papel `anon` (usuários não logados) tenha permissão de `SELECT` na tabela `reviews` e permissão de execução na função `review_author_names`.
- **Auditoria de `profiles`:** A política `profiles_public_read_policy` foi removida anteriormente. Confirmaremos através da aplicação de uma migração que garante apenas o acesso via `SECURITY DEFINER` para nomes de autores.

### 2. Frontend (`src/components/artwork-reviews.tsx`)
- **Ajuste na Lógica de Busca:** O componente já tenta buscar avaliações de forma pública, mas a falha de visualização para usuários deslogados geralmente ocorre devido a restrições de permissão no banco de dados (`GRANT`) ou falhas silenciosas na chamada RPC.
- **Tratamento de Estado:** Garantir que a ausência de uma sessão (`uid`) não impeça a renderização das avaliações existentes.

## Detalhes Técnicos

### Banco de Dados (SQL)
```sql
-- Garantir que anon possa ler reviews
GRANT SELECT ON public.reviews TO anon;

-- Garantir que anon possa executar a função de nomes de autores
GRANT EXECUTE ON FUNCTION public.review_author_names(uuid[]) TO anon;

-- Re-verificar políticas de reviews para anon
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'reviews' AND policyname = 'Anyone can view approved reviews'
    ) THEN
        CREATE POLICY "Anyone can view approved reviews" ON public.reviews
        FOR SELECT TO anon, authenticated
        USING (is_approved = true OR auth.uid() = user_id);
    END IF;
END $$;
```

## Passos de Verificação
1. **Teste de Acesso Anônimo:** Abrir a página de um produto em modo visitante e verificar se as avaliações aprovadas são carregadas.
2. **Inspeção de Rede:** Verificar se a chamada RPC `review_author_names` retorna `200 OK` e os nomes corretos sem expor dados privados.
3. **Confirmação de RLS:** Tentar acessar `/api/rest/v1/profiles` como `anon` e confirmar que retorna erro de permissão ou lista vazia.
