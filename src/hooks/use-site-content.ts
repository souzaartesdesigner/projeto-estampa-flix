import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteContentRow = {
  key: string;
  title: string | null;
  content: string | null;
};

export type ContentKeyDef = {
  key: string;
  group: string;
  label: string;
  titleLabel?: string;
  contentLabel?: string;
  hint?: string;
  rich?: boolean;
};

/** Todos os blocos de texto editáveis pelo admin em /admin/conteudos */
export const CONTENT_KEYS: ContentKeyDef[] = [
  {
    key: "home_hero",
    group: "Home",
    label: "Hero (primeira dobra)",
    titleLabel: "Título principal",
    contentLabel: "Subtítulo",
    hint: "Deixe vazio para usar o texto padrão do site.",
  },
  {
    key: "home_cta",
    group: "Home",
    label: "Botões do hero",
    titleLabel: "Texto do botão principal",
    contentLabel: "Texto do botão secundário",
  },
  {
    key: "header_notice",
    group: "Cabeçalho",
    label: "Aviso do cabeçalho",
    titleLabel: "Texto do aviso",
    contentLabel: "Link (opcional)",
    hint: 'Aparece na faixa do topo. Ative a faixa em Configurações → "Banner topo".',
  },
  {
    key: "footer",
    group: "Rodapé",
    label: "Rodapé",
    titleLabel: "Frase abaixo do logo",
    contentLabel: "Texto de copyright",
  },
  {
    key: "page_termos",
    group: "Páginas institucionais",
    label: "Termos de Uso (/termos)",
    titleLabel: "Título da página",
    contentLabel: "Conteúdo (HTML)",
    rich: true,
  },
  {
    key: "page_privacidade",
    group: "Páginas institucionais",
    label: "Política de Privacidade (/privacidade)",
    titleLabel: "Título da página",
    contentLabel: "Conteúdo (HTML)",
    rich: true,
  },
  {
    key: "page_licenca",
    group: "Páginas institucionais",
    label: "Licença (/licenca)",
    titleLabel: "Título da página",
    contentLabel: "Conteúdo (HTML)",
    rich: true,
  },
  {
    key: "page_suporte",
    group: "Páginas institucionais",
    label: "Suporte (/suporte)",
    titleLabel: "Título da página",
    contentLabel: "Texto de introdução (HTML)",
    rich: true,
  },
];

export function useSiteContentMap() {
  return useQuery({
    queryKey: ["site-content"],
    queryFn: async (): Promise<Record<string, SiteContentRow>> => {
      const { data } = await (supabase as any).from("site_content").select("key,title,content");
      const map: Record<string, SiteContentRow> = {};
      for (const row of (data ?? []) as SiteContentRow[]) map[row.key] = row;
      return map;
    },
    staleTime: 60_000,
  });
}

/** Retorna o bloco de conteúdo de uma chave (ou undefined se o admin não preencheu). */
export function useSiteContent(key: string) {
  const { data } = useSiteContentMap();
  const row = data?.[key];
  if (!row) return undefined;
  const title = row.title?.trim() || undefined;
  const content = row.content?.trim() || undefined;
  if (!title && !content) return undefined;
  return { title, content };
}
