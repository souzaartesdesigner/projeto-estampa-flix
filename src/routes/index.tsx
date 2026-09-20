import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { useI18n } from "@/lib/i18n";
import { homeQuery } from "@/features/home/home-query";
import { supabase } from "@/integrations/supabase/client";
import { HeroSection } from "@/features/home/hero-section";
import { HeroBanners } from "@/features/home/hero-banners";
import { CategoriesCarousel } from "@/features/home/categories-carousel";
import { SectionTitle } from "@/features/home/section-title";
import { ArtGrid } from "@/features/home/art-grid";
import { PlansSection } from "@/features/home/plans-section";
import { TestimonialsSection } from "@/features/home/testimonials-section";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const settings = await context.queryClient.ensureQueryData({
      queryKey: ["site-settings"],
      queryFn: async () => {
        const { data } = await (supabase as any).from("site_settings").select("*").eq("id", true).maybeSingle();
        return data;
      },
    });
    
    await context.queryClient.ensureQueryData(homeQuery);
    
    return { settings };
  },
  head: ({ loaderData }) => {
    const settings = (loaderData as any)?.settings;
    const title = settings?.home_seo_title || settings?.seo_title || "Estampa Flix — Artes digitais para sublimação e DTF";
    const description = settings?.home_seo_description || settings?.seo_description || "Baixe artes digitais em 300 DPI para sublimação, DTF e estamparia. Assinatura com créditos mensais, licença comercial vitalícia e novas estampas toda semana.";
    const ogImage = settings?.home_og_image_url || settings?.og_image_url || "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8a36e287-6af7-46bc-9720-aead028ba808/id-preview-91e266b7--bb6fa90b-8f5d-47be-8009-cbab5c7a45fa.lovable.app-1784641090696.png";

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "keywords", content: settings?.seo_keywords || "artes para sublimação, estampas digitais, arte digital DTF" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "https://estampaflix.com/" },
        { property: "og:image", content: ogImage },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImage },
      ],
      links: [{ rel: "canonical", href: "https://estampaflix.com/" }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Estampa Flix",
            url: "https://estampaflix.com",
            logo: settings?.logo_url || "https://estampaflix.com/logo.png",
            contactPoint: {
              "@type": "ContactPoint",
              telephone: settings?.whatsapp || "",
              contactType: "customer service",
            },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Estampa Flix",
            url: "https://estampaflix.com",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://estampaflix.com/catalogo?busca={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          }),
        },
      ],
    };
  },
  component: Home,
});

const DEFAULT_SECTIONS = [
  { id: "d-categories", section_type: "_categories", title: "", item_limit: 12, sort_order: 1 },
  { id: "d-new", section_type: "new", title: "", item_limit: 8, sort_order: 2 },
  { id: "d-popular", section_type: "popular", title: "", item_limit: 8, sort_order: 3 },
  { id: "d-featured", section_type: "featured", title: "", item_limit: 8, sort_order: 4 },
  { id: "d-plans", section_type: "_plans", title: "", item_limit: 0, sort_order: 5 },
] as any[];

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  const { t } = useI18n();

  const sections = data.sections && data.sections.length > 0 ? data.sections : DEFAULT_SECTIONS;

  const renderSection = (s: any) => {
    const limit = s.item_limit ?? 8;
    switch (s.section_type) {
      case "featured":
        if (data.featured.length === 0) return null;
        return (
          <section key={s.id} className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
            <SectionTitle title={s.title || t("home.featuredTitle")} subtitle={s.subtitle ?? t("home.featuredSubtitle")} />
            <ArtGrid items={data.featured.slice(0, limit)} emptyMsg={t("home.emptyGrid")} />
          </section>
        );
      case "popular":
        if (data.popular.length === 0) return null;
        return (
          <section key={s.id} className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
            <SectionTitle
              title={s.title || t("home.trendingTitle")}
              subtitle={s.subtitle ?? t("home.trendingSubtitle")}
              icon={<Zap className="h-5 w-5 text-brand-2" />}
            />
            <ArtGrid items={data.popular.slice(0, limit)} emptyMsg={t("home.emptyGrid")} />
          </section>
        );
      case "new":
        return (
          <section key={s.id} className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
            <SectionTitle
              title={s.title || t("home.recentTitle")}
              subtitle={s.subtitle ?? t("home.recentSubtitle")}
              cta={{ to: "/catalogo", label: t("home.viewAll") }}
            />
            <ArtGrid items={data.recent.slice(0, limit)} emptyMsg={t("home.emptyGrid")} />
          </section>
        );
      case "category": {
        const items = data.categoryItems?.[s.id] ?? [];
        if (items.length === 0) return null;
        return (
          <section key={s.id} className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
            <SectionTitle title={s.title || "Categoria"} subtitle={s.subtitle ?? undefined} cta={{ to: "/catalogo", label: t("home.viewAll") }} />
            <ArtGrid items={items.slice(0, limit)} emptyMsg={t("home.emptyGrid")} />
          </section>
        );
      }
      case "manual": {
        const items = data.manualItems?.[s.id] ?? [];
        if (items.length === 0) return null;
        return (
          <section key={s.id} className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
            <SectionTitle title={s.title || "Seleção"} subtitle={s.subtitle ?? t("home.featuredSubtitle")} />
            <ArtGrid items={items.slice(0, s.item_limit ?? 8)} emptyMsg={t("home.emptyGrid")} />
          </section>
        );
      }
      case "_categories":
        if (data.categories.length === 0) return null;
        return (
          <section key={s.id} className="mx-auto w-full max-w-7xl px-4 py-10 sm:py-16">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-bold sm:text-3xl">{t("home.categoriesTitle")}</h2>
              <Button asChild variant="secondary" size="sm" className="rounded-lg">
                <Link to="/catalogo" search={{ page: 1 }}>{t("home.viewCategories")}</Link>
              </Button>
            </div>
            <CategoriesCarousel categories={data.categories} />
          </section>
        );
      case "_plans":
        return <PlansSection key={s.id} plans={data.plans} />;
      default:
        return null;
    }
  };

  // If user configured sections, they may not include categories/plans — always ensure plans render at end.
  const hasPlans = sections.some((s: any) => s.section_type === "_plans");
  const hasCategories = sections.some((s: any) => s.section_type === "_categories");

  return (
    <SiteLayout>
      <HeroBanners banners={data.heroBanners} />
      <HeroSection recent={data.recent} />

      {!hasCategories && data.categories.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:py-16">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">{t("home.categoriesTitle")}</h2>
            <Button asChild variant="secondary" size="sm" className="rounded-lg">
              <Link to="/catalogo" search={{ page: 1 }}>{t("home.viewCategories")}</Link>
            </Button>
          </div>
          <CategoriesCarousel categories={data.categories} />
        </section>
      )}

      {sections.map(renderSection)}

      {data.middleBanners.length > 0 && <HeroBanners banners={data.middleBanners} />}

      {!hasPlans && <PlansSection plans={data.plans} />}

      <TestimonialsSection />
    </SiteLayout>
  );
}
