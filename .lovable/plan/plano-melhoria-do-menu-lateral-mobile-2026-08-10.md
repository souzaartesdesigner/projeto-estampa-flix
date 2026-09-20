# Plano: Melhoria do Menu Lateral Mobile

O objetivo é trazer as funcionalidades do `UserNav` (desktop) para o menu lateral do `SiteHeader` (mobile), incluindo informações de perfil, badge de downloads e suporte.

## Alterações propostas

### 1. Refatoração do `UserNav`
- Exportar sub-componentes ou lógica de exibição para que possam ser reutilizados no menu lateral do `SiteHeader`.
- Criar um componente `UserMenuContent` que contenha a lista de links e informações de perfil.

### 2. Atualização do `SiteHeader`
- Integrar o novo componente de conteúdo de usuário dentro do `SheetContent` para dispositivos móveis.
- Garantir que o design seja responsivo e mantenha a simplicidade visual solicitada.

### 3. Funcionalidades a integrar:
- Cabeçalho com Nome/Email/Avatar.
- Link para "Minha conta", "Cobrança", "Downloads" (com badge), "Favoritos" e "Admin" (se aplicável).
- Link de Suporte WhatsApp (se configurado).
- Botão de Sair.

## Verificação
- Testar a visualização mobile simulando um usuário logado e deslogado.
- Validar se o badge de downloads aparece corretamente no mobile.
- Confirmar se o link do WhatsApp abre corretamente.
