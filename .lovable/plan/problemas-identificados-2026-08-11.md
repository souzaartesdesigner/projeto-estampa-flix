---
name: Corrigir Redirecionamento Pós-Pagamento e Permissões Administrativas
description: Resolve o travamento na tela "Redirecionando para sua arte" após pagamento Pix e corrige a atribuição incorreta de artes ao administrador ao marcar pedidos como pagos manualmente.
type: feature
---

# Problemas Identificados
1. **Travamento no Redirecionamento**: O redirecionamento na página de checkout Pix não está sendo disparado de forma confiável após a confirmação do pagamento.
2. **Atribuição Incorreta de Downloads**: Ao marcar um pedido como pago no admin, a arte está sendo liberada para o administrador em vez do cliente (ou o administrador está vendo os downloads do cliente).

# Plano de Ação
1. **Página de Checkout Pix (`src/routes/pagamento.pix.$orderId.tsx`)**:
   - Refatorar a lógica de monitoramento de status para garantir que o redirecionamento ocorra imediatamente após a detecção do status `paid`.
   - Melhorar o tratamento do estado de polling para evitar loops ou estados inconsistentes.

2. **Administração de Pedidos (`src/routes/_authenticated/admin/pedidos.$id.tsx`)**:
   - Verificar se a chamada RPC `grant_order_downloads` está passando os parâmetros corretos.
   - Investigar se há algum conflito de sessão ou cache que faça o admin ver os downloads liberados como se fossem seus.

3. **Função de Banco de Dados (`grant_order_downloads`)**:
   - Garantir que a função SQL use explicitamente o `user_id` da tabela `orders` e não dependa de contextos de sessão que possam ser confundidos (como `auth.uid()` se usado incorretamente dentro da lógica de inserção).

4. **Visualização de Downloads (`src/routes/_authenticated/minha-conta.tsx` ou similar)**:
   - Verificar se a query que lista as artes para download filtra rigorosamente pelo `auth.uid()` do usuário logado.

# Validação
- Simular fluxos de confirmação de pagamento.
- Verificar a liberação de artes no banco de dados para IDs específicos de usuários.
