# Plano de Correção do Filtro de Categorias no Catálogo

## Problema Identificado

A navegação por categorias no catálogo parou de atualizar os produtos exibidos. Embora a URL mude corretamente para `/catalogo/[slug]`, a consulta (`useQuery`) no componente `CatalogoCategoria` não está capturando as mudanças ou filtrando os produtos conforme esperado, possivelmente devido a um conflito de dependências na query ou na forma como os IDs das categorias são calculados.

## Investigação

1. Revisar a lógica de `queryKey` em `src/routes/catalogo.$slug.tsx`.
2. Verificar se a função que calcula os `artworkIdsFilter` está sendo reexecutada corretamente quando o `slug` (e, portanto, a categoria atual) muda.
3. Garantir que o estado `filters` esteja sendo injetado corretamente na `useQuery`.

## Plano de Ação

1. **Auditoria de Query:** Ajustar a `queryKey` e a `queryFn` no `src/routes/catalogo.$slug.tsx` para garantir que a categoria (via `slug`) seja uma dependência explícita e reativa.
2. **Correção de Dependências:** Revisar o `useMemo` de `filters` para garantir que ele reflita a categoria correta a partir do parâmetro da rota.
3. **Validação:** Confirmar se o `artworkIdsFilter` está sendo calculado com base na categoria atual correta a cada alteração de rota.

## Perguntas para o Usuário

- O problema ocorre especificamente ao trocar de categoria, ou também ao trocar de filtro (como formato ou licença) estando já dentro de uma categoria?  
Resposta do usuario - (isso ocorre somente na categoria nos outros estão funcionando normalmente.
- Você tem algum filtro de licença ou formato ativo quando o problema acontece?  
Resposta do usuario - (sim porque quando abrimos o catalogo ele ja vem com o filtros de todas as licenças ativas mas issso acontece com filtros ativos ou não)