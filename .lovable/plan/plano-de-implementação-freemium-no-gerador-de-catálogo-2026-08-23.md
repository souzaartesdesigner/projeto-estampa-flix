# Plano de Implementação: Freemium no Gerador de Catálogo

Este plano descreve a implementação de um modelo "Freemium" para a ferramenta de Gerador de Catálogo em PDF, restringindo recursos de personalização para assinantes Premium e adicionando marca d'água em PDFs gratuitos.

## Alterações Sugeridas

### 1. Detecção de Assinatura
- Integrar o hook `useUserSubscription` na página do Gerador de Catálogo (`src/routes/gerador-catalogo.tsx`).
- Identificar se o usuário logado possui uma assinatura ativa (`lite`, `pro` ou `plus`).

### 2. Interface de Bloqueio (Paywall)
- **Campos Restritos:** "Upload de Logo", "Cor de Fundo" e "WhatsApp".
- **Visual:** Aplicar opacidade reduzida e exibir um ícone de cadeado (`Lock`) nestes campos quando o usuário não for assinante.
- **Interação:** Criar um modal "Recurso Exclusivo Premium" que é disparado ao tentar interagir com esses campos bloqueados, incentivando o upgrade para os planos Premium.

### 3. Lógica de Geração de PDF
- **Modo Gratuito:**
    - Ignorar logo customizada (mesmo que o estado tenha algo).
    - Usar cor de fundo padrão (`#e8e8e8`).
    - Remover links interativos nas imagens.
    - Adicionar marca d'água sutil no rodapé das páginas: "Gerado via Estampaflix".
- **Modo Premium:**
    - Manter todas as funcionalidades atuais (logo, cores personalizadas e links de WhatsApp).
    - PDF limpo, sem marca d'água da plataforma.

### 4. Componentes Adicionais
- Implementar o componente `PremiumFeatureModal` utilizando o componente `Dialog` existente.

## Detalhes Técnicos

### Backend e Dados
- A verificação será feita em tempo real via Supabase, consultando a tabela `subscriptions` vinculada ao `user_id` logado.

### UI/UX
- Utilizar `lucide-react` para os ícones de cadeado.
- Garantir que a "Sticky Bottom Bar" continue funcional para todos, mas reflita as limitações na geração do arquivo final.

### PDF
- A marca d'água será injetada via `jsPDF` usando o método `text` com coordenadas calculadas para o rodapé de cada página gerada no loop de artes.
