# Plano de Ajuste do Botão de Suporte Flutuante (Mobile)

O usuário solicitou que o botão flutuante de suporte no mobile fosse movido para o lado direito, aumentado e levemente subido.

## Alterações propostas

### `src/components/floating-support.tsx`

1. **Posicionamento**:
  - Mudar de `left-3` para `right-3`.
  - Aumentar o distanciamento do fundo de `bottom-[calc(0.75rem+env(safe-area-inset-bottom))]` para algo como `bottom-[calc(1.5rem+env(safe-area-inset-bottom))]` (subir um pouco).
2. **Tamanho**:
  - Aumentar o tamanho do ícone no mobile de `h-14 w-14` para `h-16 w-16` (ou similar).

## Verificação

1. Abrir a visualização no modo mobile.
2. Confirmar que o botão agora aparece no canto inferior direito.
3. Confirmar que o tamanho está maior que a versão anterior.
4. Confirmar que a margem inferior evita que ele fique "colado" no rodapé ou na barra de navegação do sistema.