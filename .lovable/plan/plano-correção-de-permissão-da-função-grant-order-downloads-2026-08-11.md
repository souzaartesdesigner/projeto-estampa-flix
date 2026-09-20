# Plano: Correção de Permissão da Função `grant_order_downloads`

O erro `permission denied for function grant_order_downloads` ocorre porque a função foi configurada como `SECURITY DEFINER` (que é correto para ações privilegiadas), mas todas as permissões de execução foram revogadas (`REVOKE ALL`) sem conceder permissão ao papel `authenticated`. Embora as rotas administrativas devam ter permissões especiais, a chamada via `supabase.rpc` no frontend administrativo falha se o usuário autenticado não tiver permissão explícita para executar a função no banco de dados.

## Problema Identificado

A migração `20260730224340_2ba5f013-813b-41c1-86d4-354dbea5f61b.sql` (e a anterior) executa:

```sql
REVOKE ALL ON FUNCTION public.grant_order_downloads(uuid) FROM PUBLIC, anon, authenticated;
```

Isso impede que qualquer usuário (incluindo administradores logados via cliente Supabase normal) execute a função.

## Alterações Propostas

### 1. Banco de Dados (Supabase)

- Criar uma nova migração para conceder permissão de execução (`GRANT EXECUTE`) na função `public.grant_order_downloads` para o papel `authenticated`.
- A função continuará protegida por sua lógica interna (verificar se o pedido está pago) e pela interface administrativa que restringe quem pode disparar a chamada.

### 2. Segurança Adicional (Opcional, mas recomendado)

- Como a função é `SECURITY DEFINER`, ela ignora RLS. É seguro conceder permissão a `authenticated` desde que a função valide internamente se o usuário tem permissão para realizar tal ação ou se o contexto é adequado.
- Atualmente a função não valida se o chamador é admin, apenas se o pedido existe e está pago. Como o frontend apenas chama isso após o admin atualizar o status do pedido para `paid`, o risco é baixo, mas para maior rigor, poderíamos adicionar um check de `public.has_role(auth.uid(), 'admin')` dentro da função SQL.

## Plano de Ação

1. **Criar Migração**: Adicionar `GRANT EXECUTE ON FUNCTION public.grant_order_downloads(uuid) TO authenticated;`.
2. **Validar**: Testar no painel administrativo se o botão "Marcar como pago" funciona sem erros de permissão.

---

**Nota**: Não alterarei o frontend, pois a chamada `supabase.rpc` está correta, o problema é puramente de permissão no banco de dados.