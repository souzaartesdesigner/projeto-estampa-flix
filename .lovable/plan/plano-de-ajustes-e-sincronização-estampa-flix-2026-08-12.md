---
name: plan
description: Implementação de sincronização de créditos, cancelamento automático de PIX expirado, formatação de preços no admin e limpeza de campos obsoletos.
type: feature
---

# Plano de Ajustes e Sincronização Estampa Flix

## Mudanças propostas

### 1. Sincronização em Tempo Real da Cota de Downloads
- Criar um novo hook `use-user-subscription.ts` que encapsula a lógica de consulta de assinatura e créditos.
- Atualizar `src/components/user-nav.tsx` e `src/features/artwork/artwork-actions.tsx` para usar este hook centralizado.
- O hook garantirá que, ao invalidar a query `user-subscription`, todos os componentes que dependem dos créditos sejam atualizados simultaneamente.

### 2. Tratamento de PIX Expirado/Pendente
- Criar uma nova rota de API de servidor `src/routes/api/public/orders/cleanup-expired.ts`.
- Esta rota poderá ser chamada por um cron job externo (ou monitoramento administrativo) para marcar pedidos `pending` com `pix_expires_at < now()` como `canceled`.
- Adicionar um botão "Limpar Pedidos Expirados" no painel de vendas do admin como solução imediata.

### 3. Formatador de Preços no Painel Admin (Real vs Centavos)
- Criar funções auxiliares `brlToCents` e `centsToBRLInput` em `src/lib/format.ts`.
- Atualizar `src/features/admin/artes/artwork-form.tsx` e `src/routes/_authenticated/admin/artes.tsx` (bulk update) para usar inputs que aceitam valores em Reais (com vírgula), convertendo para centavos antes de enviar ao Supabase.

### 4. Limpeza de Campos Obsoletos de Produtos
- Remover os campos `colors`, `resolution` e `dimensions` do formulário `src/features/admin/artes/artwork-form.tsx`.
- Ocultar/remover estas colunas da visualização em `src/features/admin/artes/artworks-table.tsx` (se aplicável).

### 5. Gerenciamento de Usuários no Admin
- Implementar as funções `createUser` e `deleteUser` no painel administrativo.
- `createUser` usará uma `server function` para criar o usuário via `supabaseAdmin.auth.admin.createUser` (para definir senha inicial).
- `deleteUser` usará `supabaseAdmin.auth.admin.deleteUser`.

## Detalhes Técnicos
- Utilização de `supabaseAdmin` em rotas de API protegidas para operações de escrita de alto privilégio (auth).
- Garantir que todas as mutações no admin chamem `invalidateQueries` para manter a UI sincronizada.
- Preservar as políticas de RLS existentes.
