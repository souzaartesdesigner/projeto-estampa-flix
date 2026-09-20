# Plano de Correção: Visibilidade e Acesso a Artes

O usuário relatou que os produtos importados aparecem no catálogo mas retornam "arte não encontrada" ao serem clicados, e não aparecem na listagem do painel administrativo.

## Problemas Identificados
1.  **Acesso ao Produto (Frontend):** A rota `/artes/$slug` falha (404) para produtos importados. O loader filtra por `is_published: true`. Verificamos que os produtos estão como `true` no banco, sugerindo que o problema pode ser o `slug` usado no link do catálogo vs o `slug` real no banco.
2.  **Visibilidade no Admin:** A listagem do admin usa busca e filtros server-side. Se os produtos não aparecem, pode haver uma dessincronização entre a contagem total e o que a query retorna, ou falha nos filtros aplicados por padrão.
3.  **Diferença de Slugs:** O importador agora gera slugs sem o SKU, mas produtos antigos ou importados recentemente podem ter slugs que o frontend não está encontrando devido a caracteres especiais ou duplicidades tratadas de forma diferente.

## Passos para Resolução

### 1. Diagnóstico de Slugs e Rotas
*   Verificar o componente `ArtworkCard` para garantir que o link gerado usa o `slug` correto.
*   Inspecionar o loader da rota `src/routes/artes.$slug.tsx` para garantir que não há outros filtros restritivos (como `license_type` ou campos nulos obrigatórios).

### 2. Correção no Painel Administrativo
*   Ajustar a query em `src/routes/_authenticated/admin/artes.tsx` para garantir que produtos sem categoria ou com dados parciais ainda sejam listados.
*   Verificar se a busca por `product_code` (SKU) está funcionando corretamente após a mudança da coluna para `TEXT`.

### 3. Ajuste de Estabilidade no Frontend
*   Garantir que o catálogo (`src/routes/catalogo.tsx`) e a página de detalhes usem a mesma lógica de busca de slug.
*   Adicionar logs temporários ou verificações de erro mais claras na página de "Não Encontrado".

## Detalhes Técnicos
*   **Banco de Dados:** Atualmente existem 495 produtos. Todos parecem estar marcados como publicados.
*   **Filtros de Segurança (RLS):** Verificar se as políticas de RLS permitem que o `anon` visualize os detalhes do produto (já que o frontend usa a chave anon).
*   **Navegação:** O TanStack Router exige parâmetros de busca específicos em certas rotas; garantir que links internos incluam esses parâmetros quando necessário.

---
Vou prosseguir com a aplicação dessas correções assim que o plano for aprovado.
