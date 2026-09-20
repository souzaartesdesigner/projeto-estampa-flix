# Plano de Correção: Exibição de Avaliações na Página do Produto

As avaliações de produto não estão aparecendo para os usuários. A auditoria inicial mostra que a tabela `reviews` possui RLS habilitado e políticas que deveriam permitir a leitura, mas há uma possível falha de permissão de acesso ao esquema `public` ou à tabela para as funções `anon` e `authenticated` (necessário `GRANT`). Além disso, vamos verificar se o componente `ArtworkReviews` está recebendo o `artworkId` correto e se a consulta está retornando dados.

## Problemas Identificados
1.  **Segurança (Supabase):** As políticas de RLS existem, mas em projetos Lovable Cloud/Supabase, é necessário conceder privilégios (`GRANT SELECT`) explicitamente para os papéis `anon` e `authenticated` na tabela, mesmo com RLS ativo.
2.  **Visibilidade:** O componente `ArtworkReviews` filtra por `is_approved = true`. Se as avaliações não forem aprovadas no painel, elas não aparecerão.

## Ações

### 1. Banco de Dados (Segurança)
- Executar comandos `GRANT` para garantir que a API PostgREST possa ler a tabela `reviews`.
- Garantir que a tabela `profiles` (usada no join das reviews) também tenha as permissões necessárias para leitura pública de nomes.

### 2. Frontend (Depuração e Componente)
- Adicionar logs no componente `ArtworkReviews` para verificar se a consulta ao Supabase está retornando erro ou array vazio.
- Verificar se o componente está sendo montado corretamente com o ID da arte.

## Detalhes Técnicos

### SQL de Permissões
```sql
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
```

### Alterações no Componente
- Nenhuma alteração estrutural no código parece necessária se o problema for apenas permissão de banco, mas adicionaremos tratamento de erro visível se a consulta falhar.
