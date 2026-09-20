# Plano de Ajuste de Layout na Página do Produto (Mobile)

O usuário relatou que, em dispositivos móveis, a imagem do produto está aparecendo abaixo das informações (título e preço), o que não é o comportamento desejado. O objetivo é restaurar o layout original onde a imagem (galeria) fica no topo e mover a seção de tags para baixo do painel de informações do produto no mobile.

## Alterações Propostas

### 1. Ajuste da Ordem no Mobile (`src/routes/artes.$slug.tsx`)
- Alterar as classes de ordem do Grid na página `ArtworkPage`.
- Atualmente, a galeria tem `order-2` e as informações têm `order-1` no mobile.
- **Mudança:** Inverter para que a galeria tenha `order-1` e as informações tenham `order-2`. Isso fará a imagem aparecer primeiro no scroll.

### 2. Reposicionamento das Tags no Mobile (`src/features/artwork/artwork-info.tsx`)
- Atualmente, as tags estão dentro do componente `ArtworkInfo`, que é renderizado acima do `ProductInfoPanel` no mobile.
- **Mudança:** Mover a lógica de exibição das tags para o final do componente ou criar uma condicional/estratégia para que elas apareçam após o painel de informações técnicas em telas menores.
- Para manter a consistência e o pedido ("abaixo do campo de informações de produto"), vou mover o bloco de tags para fora do fluxo principal de `ArtworkInfo` ou ajustar sua posição para ser a última coisa no container de informações.

## Detalhes Técnicos
- **Arquivo:** `src/routes/artes.$slug.tsx`
  - Localizar o container da galeria e mudar de `order-2 lg:order-1` para `order-1 lg:order-1`.
  - Localizar o container de info e mudar de `order-1 lg:order-2` para `order-2 lg:order-2`.
- **Arquivo:** `src/features/artwork/artwork-info.tsx`
  - Mover o bloco JSX das tags para o final do retorno do componente, garantindo que ele fique abaixo das ações de compra e informações básicas.

## Validação Visual
- Testar em viewport de 320px, 375px e 768px (MD) para garantir que o layout flua corretamente: Galeria -> Título/Preço -> Informações Técnicas -> Tags.
