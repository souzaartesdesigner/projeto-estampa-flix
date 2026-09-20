# Plano: Aumentar espaçamento na paginação (mobile)

Aumentar o espaçamento entre os itens de navegação da paginação no catálogo, apenas no mobile, para melhorar a usabilidade e evitar que os botões fiquem muito próximos.

## Alterações

### Catálogo
- Ajustar `src/features/catalog/catalog-results.tsx` para aumentar o `gap` na versão mobile de `gap-1` para `gap-2`.

## Detalhes técnicos
- Uso de classes utilitárias do Tailwind CSS.
- Manutenção da responsividade e do design "Neon Dark Blue".
- Não alterar a paginação desktop.

## Verificação
- Visualização manual da paginação no mobile (simulando 320px e larguras maiores).
- Garantir que o aumento do gap não cause overflow horizontal em telas pequenas (o que já foi tratado anteriormente ocultando o texto em telas < 370px).