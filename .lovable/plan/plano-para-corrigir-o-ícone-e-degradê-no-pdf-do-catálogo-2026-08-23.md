# Plano para corrigir o ícone e degradê no PDF do Catálogo

O problema ocorre porque `renderSocialIconForPdf` está desenhando um fundo arredondado com degradê e, em seguida, desenhando o ícone, enquanto a função `drawSocialButtons` também desenha um fundo para o botão. Isso causa sobreposição, redundância e possíveis problemas de transparência e renderização no PDF.

## Ações
1. **Alterar `renderSocialIconForPdf`**: Remover o desenho do fundo (roundedRect) e focar apenas em desenhar o ícone com fundo transparente.
2. **Atualizar `drawSocialButtons`**: Garantir que o degradê e o fundo do botão sejam desenhados corretamente pela própria função, e o ícone retornado por `renderSocialIconForPdf` seja centralizado sobre este fundo.
3. **Verificar Renderização**: Testar se isso resolve a renderização visual tanto do ícone quanto do degradê no PDF.
