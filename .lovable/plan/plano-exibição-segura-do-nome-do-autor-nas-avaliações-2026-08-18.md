# Plano: Exibição Segura do Nome do Autor nas Avaliações

Para permitir que todos os usuários (incluindo visitantes não logados) vejam o nome real de quem avaliou o produto sem comprometer a segurança, utilizaremos a coluna `author_name` já existente na tabela `reviews`. Esta coluna armazena o nome de exibição de forma denormalizada, evitando a necessidade de acessar a tabela protegida de perfis.

## Alterações Propostas

### Frontend

#### 1. Atualizar o componente de avaliações
- No arquivo `src/components/artwork-reviews.tsx`, garantir que a query do Supabase utilize a coluna `author_name`.
- Remover qualquer lógica residual que tente buscar nomes via RPC ou joins com a tabela `profiles`.
- Assegurar que o valor padrão continue sendo "Cliente" caso o nome não esteja preenchido.

### Banco de Dados (Supabase)

#### 2. Revisar Políticas de RLS
- Confirmar que a política `reviews_select_approved_anon` permite que usuários anônimos leiam as colunas necessárias (`rating`, `comment`, `author_name`, `created_at`, `is_verified`) apenas para avaliações aprovadas.
- Garantir que não há dependência da função `has_role` em políticas públicas para evitar erros de permissão.

#### 3. Verificar Trigger de Preenchimento
- Assegurar que o trigger `tg_reviews_prepare` está funcionando corretamente para inserir o `full_name` do perfil na coluna `author_name` no momento da criação da avaliação.

## Detalhes Técnicos
- **Segurança**: A tabela `profiles` permanece protegida. Apenas o nome de exibição é copiado para a avaliação pública.
- **Performance**: A leitura é direta na tabela `reviews`, sem joins complexos.
- **Privacidade**: E-mails e outros dados sensíveis dos usuários não são expostos.
