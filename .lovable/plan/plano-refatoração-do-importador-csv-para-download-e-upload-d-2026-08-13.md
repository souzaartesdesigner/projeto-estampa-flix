# Plano: Refatoração do Importador CSV para Download e Upload de Imagens

O importador CSV atualmente salva apenas URLs externas de imagens ("hotlinking"). Para evitar quebras de imagens caso o servidor antigo seja desligado, vamos refatorar o sistema para baixar essas imagens e hospedá-las no Lovable Cloud (Supabase Storage).

## Alterações Propostas

### Backend (Server Functions)
- **Nova Função de Servidor**: Criar `processExternalImage` em `src/lib/artwork-upload.functions.ts`.
- **Lógica de Processamento**: A função receberá uma URL externa, fará o download da imagem (evitando problemas de CORS no frontend) e fará o upload para o bucket `artwork-previews` no Supabase Storage.
- **Validação**: Verificar tipos de arquivos permitidos e extensões originais.

### Frontend (Importador CSV)
- **Processamento em Lotes (Batching)**: Atualizar `src/routes/_authenticated/admin/importar.tsx` para processar produtos um por um (ou em pequenos lotes), garantindo que cada imagem seja transferida antes de salvar o produto no banco.
- **Feedback de Progresso**: Melhorar a barra de progresso para indicar quando as imagens estão sendo processadas ("Transferindo imagem X de Y").
- **Substituição de URL**: Salvar a nova URL do Supabase Storage no banco de dados em vez da URL original do site antigo.

### Armazenamento
- Garantir que o bucket `artwork-previews` tenha as políticas de RLS necessárias para permitir uploads pelo administrador.

## Detalhes Técnicos
- **Fluxo**:
  1. Frontend lê CSV -> Extrai URLs de imagens.
  2. Frontend chama `processExternalImage(url)`.
  3. Servidor faz `fetch(url)` -> `blob()` -> `supabase.storage.upload()`.
  4. Servidor retorna a nova `publicUrl`.
  5. Frontend salva o produto com a nova URL.
- **Vantagens**: Independência de servidores externos, maior performance de carregamento (via CDN configurado) e segurança contra "hotlinking".

---
**Nota**: Como são 1.200+ produtos, a importação será feita de forma sequencial para evitar sobrecarga e limites de timeout do navegador.
