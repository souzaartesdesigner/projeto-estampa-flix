import { Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function ArtworkNotFound() {
  const { t } = useI18n();
  return (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">{t("product.notFound")}</h1>
        <p className="mt-2 text-muted-foreground">{t("product.notFoundDesc")}</p>
        <Button asChild className="mt-6"><Link to="/catalogo" search={{ page: 1 }}>{t("product.backToCatalog")}</Link></Button>
      </div>
    </SiteLayout>
  );
}

export function ArtworkErrorBoundary() {
  const { t } = useI18n();
  return (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">{t("product.somethingWrong")}</h1>
      </div>
    </SiteLayout>
  );
}
