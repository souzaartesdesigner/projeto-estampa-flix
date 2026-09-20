import { sanitizeHtml } from "@/lib/sanitize-html";
import { useI18n } from "@/lib/i18n";

export function ArtworkDescription({ html }: { html: string }) {
  const { t } = useI18n();
  if (!html) return null;
  return (
    <section className="mt-12 rounded-2xl border border-border/60 bg-card p-6 md:p-8">
      <h2 className="mb-4 font-display text-2xl font-bold">{t("product.description")}</h2>
      <div
        className="woo-description prose prose-invert max-w-none text-sm leading-relaxed text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
      />
    </section>
  );
}
