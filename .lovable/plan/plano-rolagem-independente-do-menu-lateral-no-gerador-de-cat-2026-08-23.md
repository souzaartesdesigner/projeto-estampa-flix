# Plano: Rolagem Independente do Menu Lateral no Gerador de Catálogo

Corrigir a usabilidade na página de Gerador de Catálogo, permitindo que o painel lateral de configurações tenha sua própria rolagem e permaneça fixo enquanto o usuário navega pela grade de produtos.

## Alterações

### Frontend

- **src/routes/gerador-catalogo.tsx**
  - Ajustar o elemento `aside` (painel lateral) para ter uma altura máxima limitada e rolagem interna.
  - Aplicar `sticky top-24` (ou `top-20`) para manter o painel visível durante o scroll da página.
  - Adicionar `overflow-y-auto` e esconder a barra de rolagem se preferível (ou mantê-la padrão).
  - Usar `max-h-[calc(100vh-120px)]` para garantir que o painel não ultrapasse a área visível do navegador, considerando o cabeçalho.

## Detalhes Técnicos

1. Localizar o componente `CatalogGeneratorPage`.
2. No `aside` localizado por volta da linha 468, alterar a `className`:
   - De: `space-y-4 lg:sticky lg:top-24 lg:self-start`
   - Para: `space-y-4 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent`
   - Nota: Adicionei `lg:pr-2` para evitar que a scrollbar sobreponha o conteúdo dos cards se necessário.
