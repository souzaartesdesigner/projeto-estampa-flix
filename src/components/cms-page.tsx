import type { ReactNode } from "react";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { useSiteContent } from "@/hooks/use-site-content";

/**
 * Renderiza o conteúdo institucional definido pelo admin em /admin/conteudos.
 * Se o admin não preencheu nada, mostra o conteúdo padrão (children).
 */
export function CmsPage({
  contentKey,
  defaultTitle,
  children,
}: {
  contentKey: string;
  defaultTitle: string;
  children: ReactNode;
}) {
  const cms = useSiteContent(contentKey);

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 text-sm leading-relaxed text-muted-foreground">
      <h1 className="mb-2 font-display text-3xl font-bold text-foreground">{cms?.title || defaultTitle}</h1>
      <p className="mb-8 text-xs">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
      {cms?.content ? (
        <div
          className="cms-content prose prose-invert max-w-none [&_a]:text-primary [&_a]:underline [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:mb-1 [&_p]:mb-4 [&_strong]:text-foreground [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(cms.content) }}
        />
      ) : (
        children
      )}
    </article>
  );
}
