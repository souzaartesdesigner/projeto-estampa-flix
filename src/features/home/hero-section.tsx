import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { tField, useI18n } from "@/lib/i18n";
import { useSiteContent } from "@/hooks/use-site-content";
import { SmartImage } from "@/components/smart-image";


export function HeroSection({ recent }: { recent: any[] }) {
  const { t, lang } = useI18n();
  const heroCms = useSiteContent("home_hero");
  const ctaCms = useSiteContent("home_cta");
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-primary/25 blur-[120px]" />
        <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-brand-2/20 blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0 / 0.6) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 0.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>
      <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 sm:gap-12 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:py-28">
        <div className="flex flex-col justify-center gap-5 sm:gap-7">
          <Badge className="glass-panel w-fit gap-1.5 rounded-full border-primary/30 px-3 py-1 text-primary">
            <Zap className="h-3 w-3" /> {t("home.badge")}
          </Badge>
          <h1 className="font-display text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">

            {heroCms?.title ? (
              heroCms.title
            ) : (
              <>
                {t("home.heroTitle1")}{" "}
                <span className="text-gradient-brand">{t("home.heroTitleHighlight")}</span>{" "}
                {t("home.heroTitle2")}
              </>
            )}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl">
            {heroCms?.content || t("home.heroSubtitle")}
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 rounded-full bg-gradient-brand px-6 text-brand-foreground shadow-brand transition-transform hover:-translate-y-0.5 hover:opacity-95">
              <Link to="/planos">{ctaCms?.title || t("home.ctaPlans")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-border/60 bg-background/30 px-6 backdrop-blur transition-colors hover:border-primary/50 hover:bg-primary/10">
              <Link to="/catalogo" search={{ page: 1 }}>{ctaCms?.content || t("home.ctaCatalog")}</Link>
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> {t("home.check1")}</span>
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> {t("home.check2")}</span>
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-success" /> {t("home.check3")}</span>
          </div>
        </div>
        <div className="relative hidden lg:block">
          <div aria-hidden className="absolute -inset-6 rounded-3xl bg-gradient-brand opacity-20 blur-3xl" />
          <div className="relative grid grid-cols-3 gap-3">
            {recent.slice(0, 9).map((a, i) => (
              <div
                key={a.id}
                className={`aspect-square overflow-hidden rounded-2xl border border-border/60 bg-surface transition-transform duration-500 hover:-translate-y-1 ${
                  i === 4 ? "shadow-brand ring-1 ring-primary/40" : "shadow-elegant"
                }`}
                style={{ transform: `translateY(${(i % 3) * 14}px)` }}
              >
                <SmartImage
                  src={a.preview_url}
                  alt={tField(a as any, "title", lang) || a.title}
                  widths={[200, 320, 400]}
                  fallbackWidth={320}
                  sizes="200px"
                  priority={i === 0}
                  loading={i < 3 ? "eager" : "lazy"}
                  className="h-full w-full object-cover"
                  width={400}
                  height={400}
                />

              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
