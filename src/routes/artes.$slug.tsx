import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site-layout";
import { ArtworkGallery } from "@/components/artwork-gallery";
import { ArtworkReviews } from "@/components/artwork-reviews";
import { tField, useI18n } from "@/lib/i18n";
import {
  ArtworkErrorBoundary,
  ArtworkNotFound,
} from "@/features/artwork/artwork-boundaries";
import { ArtworkInfo } from "@/features/artwork/artwork-info";
import { ArtworkDescription } from "@/features/artwork/artwork-description";
import { ProductInfoPanel } from "@/features/artwork/product-info-panel";
import { RelatedArtworks } from "@/features/artwork/related-artworks";
import {
  useArtworkOwnership,
  useArtworkSession,
  useMySubscription,
} from "@/features/artwork/artwork-actions";
import { useEffect } from "react";
import { trackViewItem } from "@/lib/analytics";

export const Route = createFileRoute("/artes/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("artworks")
      .select("id,slug,title,description,category_id,preview_url,file_format,colors,price_cents,license_type,is_published,is_featured,is_trending,download_count,view_count,created_at,updated_at,credit_cost,gallery_urls,translations,featured_order,seo_title,seo_description,seo_keyword,product_code,alt_text,noindex,tech_specs,resolution,dimensions,usage_instructions,license_text, categories!artworks_category_id_fkey(name,slug), artwork_categories(categories(id,name,slug)), artwork_tags(tags(id,name,slug))")
      .eq("slug", params.slug)
      .maybeSingle();
    
    if (error) {
      console.error("Erro ao carregar arte:", error);
      throw error;
    }
    if (!data) throw notFound();
    return data;
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Arte não encontrada" }, { name: "robots", content: "noindex" }] };
    const url = `https://estampaflix.com/artes/${params.slug}`;
    const clamp = (s: string, max: number) => {
      const t = s.trim();
      if (t.length <= max) return t;
      const cut = t.slice(0, max);
      const i = cut.lastIndexOf(" ");
      return `${(i > max * 0.6 ? cut.slice(0, i) : cut).replace(/[,;:.\-\s]+$/, "")}…`;
    };
    const plainDesc = (loaderData.description ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\\n/g, " ")
      .replace(/&nbsp;/gi, " ")
      // remove o aviso padrão repetido em todos os produtos importados
      .replace(/ATEN[ÇC][ÃA]O:[\s\S]*?download direto na sua conta\.?/i, " ")
      .replace(/\s+/g, " ")
      .trim();
    const fallback = `${loaderData.title} — arte digital em alta resolução (300 DPI) para sublimação, DTF e estamparia, com licença comercial na Estampa Flix.`;
    const seoDesc = ((loaderData as any).seo_description ?? "").trim().replace(/%%title%%/gi, loaderData.title);
    const description = clamp(seoDesc || (plainDesc.length >= 50 ? plainDesc : fallback), 158);
    const rawTitle = ((loaderData as any).seo_title ?? "").trim().replace(/%%title%%/gi, loaderData.title) || loaderData.title;
    // só acrescenta o complemento quando couber sem truncar
    const seoTitle = clamp(
      rawTitle.replace(/\s*[—-]\s*Estampa Flix\s*$/i, "").trim(),
      60,
    );
    const suffix = " - Download de Estampa Editável | Estampa Flix";
    const pageTitle =
      seoTitle.length + suffix.length <= 70
        ? `${seoTitle}${suffix}`
        : seoTitle.length <= 45
          ? `${seoTitle} — Estampa Flix`
          : seoTitle;

    const keyword = ((loaderData as any).seo_keyword ?? "").trim() || loaderData.title.toLowerCase();
    const noindex = !!(loaderData as any).noindex;
    return {
      meta: [
        { title: pageTitle },
        { name: "description", content: description },
        { name: "keywords", content: keyword },
        { name: "robots", content: noindex ? "noindex,nofollow" : "index,follow" },
        { property: "og:title", content: pageTitle },
        { property: "og:description", content: description },
        { property: "og:image", content: loaderData.preview_url },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        { name: "twitter:title", content: pageTitle },

        { name: "twitter:description", content: description },
        { name: "twitter:image", content: loaderData.preview_url },
      ],
      links: [{ rel: "canonical", href: url }],

      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: loaderData.title,
            image: [loaderData.preview_url, ...(((loaderData as any).gallery_urls ?? []) as string[])].filter(Boolean),
            description,
            sku: (loaderData as any).product_code || loaderData.slug,
            category: (loaderData as any).categories?.name ?? undefined,
            brand: { "@type": "Brand", name: "Estampa Flix" },
            offers: {
              "@type": "Offer",
              url,
              priceCurrency: "BRL",
              price:
                (loaderData as any).license_type === "free"
                  ? "0.00"
                  : (Number(loaderData.price_cents ?? 0) / 100).toFixed(2),
              availability: "https://schema.org/InStock",
              itemCondition: "https://schema.org/NewCondition",
            },

          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Início", item: "https://estampaflix.com/" },
              { "@type": "ListItem", position: 2, name: "Catálogo", item: "https://estampaflix.com/catalogo" },
              { "@type": "ListItem", position: 3, name: loaderData.title, item: url },
            ],
          }),
        },
      ],
    };
  },
  component: ArtworkPage,
  notFoundComponent: ArtworkNotFound,
  errorComponent: ArtworkErrorBoundary,
});

function ArtworkPage() {
  const artwork = Route.useLoaderData();
  const { t, lang } = useI18n();
  const trTitle = tField(artwork as any, "title", lang) || artwork.title;
  const trDesc = tField(artwork as any, "description", lang) || (artwork.description ?? "");
  const galleryImages = [artwork.preview_url, ...((artwork as any).gallery_urls ?? [])].filter(Boolean);

  const { data: session } = useArtworkSession();
  const { data: sub } = useMySubscription(session?.user.id);
  const { data: owned } = useArtworkOwnership(session?.user.id, artwork.id);

  useEffect(() => {
    if (artwork) {
      trackViewItem(artwork);
    }
  }, [artwork]);

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
        <nav className="mb-4 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">{t("product.crumbHome")}</Link> /{" "}
          <Link to="/catalogo" search={{ page: 1 }} className="hover:text-foreground">{t("product.crumbCatalog")}</Link> /{" "}
          <span className="text-foreground">{trTitle}</span>
        </nav>

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-8">
          <div className="order-1 lg:order-1">
            <ArtworkGallery
              images={galleryImages}
              alt={(artwork as any).alt_text || ""}
              licenseType={artwork.license_type}
              isFeatured={artwork.is_featured}
              isTrending={artwork.is_trending}
            />
            <div className="hidden lg:block">
              <ProductInfoPanel artwork={artwork} />
            </div>
          </div>
          <div className="order-2 lg:order-2">
            <ArtworkInfo artwork={artwork} title={trTitle} session={session} sub={sub} owned={owned} />
            <div className="lg:hidden">
              <ProductInfoPanel artwork={artwork} />
            </div>
          </div>
        </div>

        <RelatedArtworks
          categoryIds={Array.from(new Set([
            (artwork as any).category_id,
            ...(((artwork as any).artwork_categories ?? []).map((r: any) => r.categories?.id)),
          ].filter(Boolean))) as string[]}
          currentId={artwork.id}
        />

        <ArtworkReviews artworkId={artwork.id} />

        <ArtworkDescription html={trDesc} />
      </div>
    </SiteLayout>
  );
}
