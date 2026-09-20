# Plano de Refatoração: Performance Admin e Importador CSV

Ajustes estruturais no banco de dados, importador e painel administrativo para suportar catálogos grandes (1200+ produtos) com alta performance e SEO otimizado.

## Alterações Sugeridas

### 1. Banco de Dados (Supabase)
- **Restrição UNIQUE**: Remover a restrição UNIQUE da coluna `title` na tabela `artworks`.
- **Slugs Únicos**: Garantir que o `product_code` seja usado na geração de slugs para evitar colisões.

### 2. Importador CSV (`src/routes/_authenticated/admin/importar.tsx`)
- **Higienização SEO**: Implementar substituição da string `%%title%%` pelo título real do produto durante a importação.
- **Robustez**: Garantir que novos campos sejam tratados corretamente.

### 3. Frontend SEO (`src/routes/artes.$slug.tsx`)
- **Meta Tags Dinâmicas**: Aplicar `.replace('%%title%%', product.title)` em todas as meta tags renderizadas no lado do cliente e servidor.

### 4. Painel Administrativo de Artes (`src/routes/_authenticated/admin/artes.tsx`)
- **Paginação Server-Side**: Refatorar para carregar dados em blocos de 30 itens usando `limit` e `offset` do Supabase.
- **Busca Server-Side**: Substituir o filtro em memória por buscas `ilike` ou `eq` (para código do produto) diretamente no banco de dados.
- **Filtros Dinâmicos**: Adicionar seletores de Categoria e Status (Publicado/Rascunho) integrados à query do servidor.

### 5. SEO Check (`src/routes/_authenticated/admin/seo-check.tsx`)
- **Performance**: Ajustar para evitar o carregamento massivo de 1000+ itens.

## Detalhes Técnicos
- Utilizar `useQuery` com parâmetros de `page`, `search`, `category` e `status`.
- Implementar debounce na busca para evitar excesso de requisições.
- Manter compatibilidade com a tipagem do Supabase gerada.

---
**Nota**: A remoção da restrição UNIQUE deve ser feita via migração SQL.
