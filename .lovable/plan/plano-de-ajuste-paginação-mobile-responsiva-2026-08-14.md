# Plano de Ajuste: Paginação Mobile Responsiva

Garantir que os textos "Anterior" e "Próxima" apareçam na paginação mobile sempre que houver espaço suficiente, reduzindo apenas em telas extremamente pequenas (como iPhone SE) para evitar o scroll horizontal.

## Alterações Sugeridas

### Frontend
- Ajustar `src/features/catalog/catalog-results.tsx`.
- Mudar o breakpoint de visibilidade do texto de `xs` para um valor customizado ou usar `@container` query se possível, mas manteremos o padrão Tailwind simplificado.
- Atualmente está `hidden xs:inline`. Vou mudar para `hidden xxs:inline` e definir um breakpoint menor ou simplesmente ajustar o `xs` (que no projeto costuma ser 480px) para algo como 375px. 
- Na verdade, o ideal é usar `hidden 350px:inline` ou algo do tipo. Vou ajustar a lógica para mostrar o texto a partir de 360px de largura.

## Detalhes Técnicos
- Mudar `hidden xs:inline` para `hidden min-[360px]:inline`.
- Garantir que o container central (`min-w-[70px]`) e os botões tenham flexibilidade.
- Reduzir levemente os paddings horizontais em telas muito pequenas.

## Verificação
- Testar em 320px (deve mostrar apenas ícones).
- Testar em 375px (deve mostrar texto + ícones).
- Confirmar ausência de scroll horizontal.
