# Plano de Ajustes Visuais e Correções Frontend

Ajustes para melhorar a experiência do utilizador, focando na consistência visual dos selos (badges), legibilidade das categorias e padronização do grid em tablets.

## Ajustes e Correções

### 1. Posicionamento dos Selos na Página de Produto
- **Arquivo:** `src/features/artwork/artwork-info.tsx`
  - Remover a lógica de renderização dos selos (Premium/Grátis, Destaque e Em Alta) do cabeçalho de informações.
- **Arquivo:** `src/components/artwork-gallery.tsx`
  - Atualizar a interface `Props` para receber `licenseType`, `isFeatured` e `isTrending`.
  - Implementar a renderização dos selos flutuando sobre a imagem principal no canto superior esquerdo (`absolute top-4 left-4 z-10`), seguindo o estilo visual dos cards da vitrine.
- **Arquivo:** `src/routes/artes.$slug.tsx` (ou onde o componente é instanciado)
  - Passar as propriedades necessárias para o `ArtworkGallery`.

### 2. Aumento da Fonte das Categorias nos Cards
- **Arquivo:** `src/components/artwork-card.tsx`
  - Alterar a classe utilitária de tamanho de fonte do nome da categoria de `text-[11px]` para `text-[12px]`.

### 3. Consistência do Grid em Tablets (md:grid-cols-2)
- **Arquivo:** `src/features/home/art-grid.tsx`
  - Alterar `md:grid-cols-3` para `md:grid-cols-2`.
- **Arquivo:** `src/features/artwork/related-artworks.tsx`
  - Adicionar explicitamente `md:grid-cols-2` ao grid de produtos relacionados.
- **Arquivo:** `src/features/catalog/catalog-results.tsx`
  - Adicionar explicitamente `md:grid-cols-2` ao grid de resultados do catálogo para garantir a consistência solicitada.

## Detalhes Técnicos
- Utilização de classes utilitárias do Tailwind CSS.
- Preservação da lógica de internacionalização (i18n) e campos traduzidos.
- Manutenção da responsividade e glassmorphism nos selos.

*Nota: Foram identificados apenas 3 dos 4 ajustes mencionados na mensagem inicial. Executaremos estes 3 com precisão.*
