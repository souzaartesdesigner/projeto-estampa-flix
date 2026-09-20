# Plano de Correção: Scroll Horizontal na Paginação Mobile

Ajustar a paginação mobile para evitar o estouro horizontal em telas pequenas (como 320px) e garantir que os elementos se adaptem corretamente ao espaço disponível.

## Alterações Sugeridas

### Frontend

- Ajustar o componente `CatalogResults` em `src/features/catalog/catalog-results.tsx`.
- Reduzir o `padding` e `gap` nos botões da paginação mobile.
- Ajustar a largura mínima do contador central.
- Garantir que o texto dos botões ("Anterior" / "Próxima") seja ocultado ou reduzido em telas extremamente estreitas, se necessário, ou apenas diminuir as margens.

## Detalhes Técnicos

- Mudar `gap-1.5` para `gap-1` no container mobile.
- Reduzir `px-4` para `px-3` ou `px-2` nos botões e no contador.
- Usar `flex-1` ou `max-w` apropriados para garantir que nada extrapole `100vw`.
- Adicionar uma regra de `min-width: 0` para evitar que o flexbox impeça o encolhimento.

## Verificação

- Testar no preview com largura de 320px.
- Confirmar que não há scroll lateral na parte inferior da página.