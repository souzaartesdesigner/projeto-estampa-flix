# Plan - Instalar Google Tag Manager (GTM)

O usuário solicitou a instalação do Google Tag Manager fornecendo os códigos para `<head>` e `<body>`. Para garantir que isso seja flexível e gerenciável via painel administrativo, vou implementar suporte a scripts de corpo no banco de dados e na interface.

## Alterações

### 1. Banco de Dados
- Adicionar coluna `body_scripts` à tabela `site_settings` via migração SQL.
- Atualizar a configuração existente com os códigos GTM fornecidos.

### 2. Frontend (TanStack Start)
- **`src/routes/__root.tsx`**:
    - Atualizar tipo `RootSeo` e o `loader` para incluir `bodyScripts`.
    - Modificar `RootShell` para renderizar `bodyScripts` imediatamente após a abertura da tag `<body>`.
- **`src/routes/_authenticated/admin/configuracoes.tsx`**:
    - Adicionar campo de texto para "Scripts do body" na aba de Analytics, permitindo que o administrador gerencie esses scripts futuramente.

## Verificação
- Verificar se o script GTM aparece no `<head>` do código-fonte da página.
- Verificar se o `noscript` do GTM aparece logo após o `<body>`.
- Confirmar que as configurações são salvas corretamente no painel administrativo.
