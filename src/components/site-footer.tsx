import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useSiteContent } from "@/hooks/use-site-content";
import logoAsset from "@/assets/estampa-flix-logo.png.asset.json";

export function SiteFooter() {
  const { t } = useI18n();
  const { data: settings } = useSiteSettings();
  const cms = useSiteContent("footer");
  const logoUrl = settings?.logo_url || logoAsset.url;
  const siteName = settings?.site_name || "Estampa Flix";
  return (
    <footer className="mt-24 border-t border-border/50 bg-surface/40">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <img src={logoUrl} alt={siteName} className="h-10 w-auto max-w-[180px] object-contain" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{cms?.title || settings?.footer_text || t("footer.tagline")}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">{t("footer.navigation")}</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/catalogo" search={{ page: 1 }} className="hover:text-foreground">{t("nav.catalog")}</Link></li>
            <li><Link to="/planos" className="hover:text-foreground">{t("nav.plans")}</Link></li>
            <li><Link to="/gerador-catalogo" className="hover:text-foreground">Gerador de Catálogo</Link></li>
            <li><Link to="/blog" className="hover:text-foreground">{t("nav.blog")}</Link></li>
            <li><Link to="/suporte" className="hover:text-foreground">{t("nav.support")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">{t("footer.account")}</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/login" className="hover:text-foreground">{t("footer.signInCreate")}</Link></li>
            <li><Link to="/minha-conta" search={{ tab: "profile" }} className="hover:text-foreground">{t("nav.myAccount")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">{t("footer.legal")}</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/termos" className="hover:text-foreground">{t("footer.terms")}</Link></li>
            <li><Link to="/privacidade" className="hover:text-foreground">{t("footer.privacy")}</Link></li>
            <li><Link to="/licenca" className="hover:text-foreground">{t("footer.license")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        {cms?.content || `© ${new Date().getFullYear()} ${siteName} — ${t("footer.copyright")}`}
      </div>
    </footer>
  );
}
