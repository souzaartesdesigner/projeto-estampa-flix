# Plano: Paginação Responsiva e Minimalista para Mobile

Implementar um novo layout de paginação exclusivo para dispositivos móveis, mantendo a visão completa no desktop.

## Alterações Sugeridas

### 1. Atualizar o componente de resultados do catálogo
- **Arquivo:** `src/features/catalog/catalog-results.tsx`
- **Ação:**
    - Refatorar a seção de paginação para incluir dois modos:
        - **Desktop:** Visível apenas a partir de `sm` (`hidden sm:flex`). Mantém o componente `Pagination` atual com todos os números.
        - **Mobile:** Visível apenas em telas pequenas (`flex sm:hidden`). Implementar um novo container com:
            - Botão "Anterior" (ChevronLeft) com estilo circular escuro.
            - Texto central "Página {page} de {totalPages}".
            - Botão "Próximo" (ChevronRight) com o mesmo estilo.
    - Adicionar `window.scrollTo({ top: 0, behavior: 'smooth' })` em ambas as implementações de clique.

## Detalhes Técnicos
- Utilizar `flex sm:hidden` e `hidden sm:flex` para alternância responsiva.
- Estilizar os botões mobile com `bg-primary text-primary-foreground w-10 h-10 rounded-md flex items-center justify-center`.
- Garantir que a lógica de `totalPages` e `onPageChange` seja compartilhada entre as visões.
