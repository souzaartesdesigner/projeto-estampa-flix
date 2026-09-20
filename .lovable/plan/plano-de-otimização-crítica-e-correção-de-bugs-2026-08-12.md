# Plano de Otimização Crítica e Correção de Bugs

Este plano visa resolver problemas severos de performance (LCP mobile), acessibilidade, erros de hidratação do React e carregamento de scripts de terceiros, conforme as métricas do PageSpeed Insights.

## Alterações Propostas

### 1. Otimização Extrema de Imagens
- **Ajuste no Proxy `wsrv.nl`**: Modificar `src/lib/image-cdn.ts` para incluir `&output=webp` e garantir que o parâmetro `&w=` seja otimizado para os breakpoints mobile.
- **Implementação de `srcset` e `sizes`**: Revisar `src/components/smart-image.tsx` e `src/components/artwork-card.tsx` para assegurar que as imagens não sejam superdimensionadas no mobile (ex: solicitando 960px para um container de 226px).
- **Atributos de Tamanho Estáticos**: Adicionar `width` e `height` (ou `aspect-ratio`) explícitos em `SiteHeader` (logo), `ArtworkCard` e carrosséis para eliminar o CLS (Cumulative Layout Shift).

### 2. Desbloqueio de Renderização (CSS e Fontes)
- **Google Fonts**: Adicionar `&display=swap` na URL das fontes em `src/routes/__root.tsx`.
- **Preload Crítico**: Adicionar `<link rel="preload">` para o CSS principal e fontes em `__root.tsx`.

### 3. Correção do Erro de Hidratação (React #418)
- **Investigação de Mismatch**: Localizar e corrigir divergências entre SSR e Client em `src/routes/index.tsx`.
- **Correção Semântica**: Verificar tags aninhadas incorretamente (ex: `div` dentro de `p`) e estados dinâmicos (datas/browser storage) que precisam de `useEffect` ou `useHydrated`.

### 4. Atraso de Scripts de Terceiros (GTM/Analytics)
- **Estratégia de Carregamento**: Modificar o carregamento do GTM em `src/lib/analytics.ts` ou `__root.tsx` para usar `defer` ou carregar apenas após a primeira interação do usuário (ou via `requestIdleCallback`), reduzindo o TBT (Total Blocking Time).

### 5. Acessibilidade e Touch Targets
- **Área de Clique**: Aumentar padding e dimensões de botões em `HeroBanners`, `CategoriesCarousel` e `PromoBanner` para atingir o mínimo de 44x44px.
- **Hierarquia de Headings**: Corrigir a sequência de `h1` a `h6` em `HeroSection`, `SectionTitle` e rodapé para garantir validade lógica para SEO e leitores de tela.

## Detalhes Técnicos

- **Tecnologias**: React 19, TanStack Start, Tailwind CSS v4, Proxy wsrv.nl.
- **Segurança**: Manutenção das RLS e políticas de bucket existentes.
- **SEO**: Preservação das metatags dinâmicas e JSON-LD.

---
*Este plano foca exclusivamente na performance e estabilidade solicitada, sem alterações visuais não relacionadas.*
