# Plano de Implementação: Gerenciador de SEO Dinâmico para Páginas Estáticas

Este plano descreve a implementação de um sistema robusto de gerenciamento de SEO para as páginas principais do Estampa Flix (Home, Planos, Sobre Nós, Contato), permitindo controle total via Painel Administrativo.

## 1. Banco de Dados (Supabase)
Adicionar colunas de SEO específico para páginas estáticas na tabela `site_settings`.

```sql
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS home_seo_title TEXT,
ADD COLUMN IF NOT EXISTS home_seo_description TEXT,
ADD COLUMN IF NOT EXISTS home_og_image_url TEXT,
ADD COLUMN IF NOT EXISTS plans_seo_title TEXT,
ADD COLUMN IF NOT EXISTS plans_seo_description TEXT,
ADD COLUMN IF NOT EXISTS plans_seo_keyword TEXT;
```

## 2. Painel Administrativo
- Modificar `src/routes/_authenticated/admin/configuracoes.tsx`.
- Adicionar uma nova seção ou aba dentro de "SEO / Analytics" chamada "SEO de Páginas Estáticas".
- Incluir formulários para editar os metadados da **Home** e da página de **Planos**.

## 3. Frontend (TanStack Router & Head)
Injetar dinamicamente as meta tags nas rotas usando a função `head` do TanStack Router, buscando dados de `site_settings`.

- **Home (`src/routes/index.tsx`)**:
  - Injetar Meta Title, Description e OG Image.
  - Adicionar JSON-LD `Organization` e `WebSite`.
- **Planos (`src/routes/planos.tsx`)**:
  - Injetar Meta Title, Description e Keywords.
  - Adicionar JSON-LD `Product` / `Offer` (PriceSpecification) baseado nos planos reais do banco.

## 4. Marcação Estruturada (JSON-LD)
- **Home**: Informações da marca, logo e URL.
- **Planos**: Listagem dinâmica de ofertas baseada na tabela `plans`.

## Detalhes Técnicos
- Utilizar o hook `useSiteSettings` para acessar os dados.
- Garantir que as tags OG (Open Graph) reflitam os valores personalizados.
- Manter fallbacks (valores padrão) caso os campos de SEO estejam vazios.

## Critérios de Aceite
- Títulos e descrições das páginas Home e Planos alteráveis via Admin.
- Meta tags verificadas no `<head>` de cada página.
- JSON-LD válido testado via script injection.
