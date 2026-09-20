import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import {
  catalogSearchSchema,
  type CatalogSearch,
} from "@/features/catalog/catalog-constants";
import { CatalogFilters } from "@/features/catalog/catalog-filters";
import { CatalogResults } from "@/features/catalog/catalog-results";

export const Route = createFileRoute("/catalogo/")({
  validateSearch: (search) => catalogSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ context: { queryClient }, deps: { search } }) => {
    const filters = search as CatalogSearch;
    if (filters.categoria) {
      const catSlug = filters.categoria;
      await queryClient.ensureQueryData({
        queryKey: ["category-seo", catSlug],
        queryFn: async () => {
          const { data } = await supabase
            .from("categories")
            .select("name, slug, seo_title, seo_description, seo_keyword, cover_url, cover_alt")
            .eq("slug", catSlug)
            .maybeSingle();
          return data;
        },
      });
    }
    return null;
  },
  head: (args) => {
    // Acessar via search validado se disponível no contexto do TanStack Start
    const search = (args as any).search as CatalogSearch;
    const catSlug = search?.categoria;
    
    return {
      meta: [
        { title: catSlug ? `${catSlug.charAt(0).toUpperCase() + catSlug.slice(1)} — Estampa Flix` : "Catálogo de artes digitais — Estampa Flix" },
        { name: "description", content: "Explore milhares de artes digitais prontas para sublimação, DTF e estamparia. Filtre por categoria, formato e cor e baixe em alta resolução." },
        { property: "og:title", content: catSlug ? `${catSlug.charAt(0).toUpperCase() + catSlug.slice(1)} — Estampa Flix` : "Catálogo de artes digitais — Estampa Flix" },
        { property: "og:description", content: "Milhares de artes em 300 DPI para sublimação e DTF. Filtre por categoria, formato e cor e baixe com licença comercial." },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `https://estampaflix.com/catalogo${catSlug ? `/${catSlug}` : ""}` },
      ],
      links: [{ rel: "canonical", href: `https://estampaflix.com/catalogo${catSlug ? `/${catSlug}` : ""}` }],
    };
  },
  component: Catalogo,
});


function Catalogo() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [q, setQ] = useState(search.q ?? "");
  
  useEffect(() => {
    setQ(search.q ?? "");
  }, [search.q]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { t } = useI18n();

  const { data: currentCategory } = useQuery({
    queryKey: ["category-seo", search.categoria],
    enabled: !!search.categoria,
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", search.categoria!)
        .maybeSingle();
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("id,slug,name,parent_id,translations").order("sort_order").order("name")).data ?? [],
  });
  const { data: formats = [] } = useQuery({
    queryKey: ["artwork-formats"],
    queryFn: async () => {
      const { data } = await supabase.from("artworks").select("file_format").eq("is_published", true).not("file_format", "is", null);
      const set = new Set<string>();
      for (const r of data ?? []) {
        const f = (r.file_format || "").trim().toLowerCase().replace(/^\./, "");
        if (f) set.add(f);
      }
      return Array.from(set).sort();
    },
  });


  const filters = useMemo(() => search, [search]);
  const page = search.page || 1;
  const ITEMS_PER_PAGE = 24;
  const resultsRef = useRef<HTMLDivElement>(null);

  const { data: { artworks = [], count = 0 } = {}, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["catalog", search, categories.length, page],
    enabled: categories.length > 0,
    queryFn: async () => {
      console.log("Fetching catalog with search filters:", search);
      let artworkIdsFilter: string[] | null = null;
      if (search.categoria) {
        const cat = categories.find((c: any) => c.slug === search.categoria);
        if (!cat) {
          console.warn("Category not found for slug:", search.categoria);
          return { artworks: [], count: 0 };
        }
        const ids = [cat.id, ...categories.filter((c: any) => c.parent_id === cat.id).map((c: any) => c.id)];
        const { data: links } = await supabase
          .from("artwork_categories")
          .select("artwork_id")
          .in("category_id", ids);
        artworkIdsFilter = Array.from(new Set((links ?? []).map((l: any) => l.artwork_id)));
        console.log("Found artwork IDs for category:", artworkIdsFilter?.length);
        if (!artworkIdsFilter || artworkIdsFilter.length === 0) return { artworks: [], count: 0 };
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from("artworks")
        .select("id,slug,title,preview_url,price_cents,license_type,is_featured,is_trending,download_count,category_id,colors,file_format,translations,categories!artworks_category_id_fkey(id,name,slug,translations),artwork_categories(categories(id,name,slug,translations))", { count: 'exact' })
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (search.q) {
        const term = search.q.trim();
        if (term) {
          query = query.or(`product_code.ilike.${term}%,title.ilike.%${term}%`);
        }
      }

      if (artworkIdsFilter) query = query.in("id", artworkIdsFilter);
      if (search.licenca) query = query.eq("license_type", search.licenca);
      if (search.formato) query = query.eq("file_format", search.formato);
      if (search.cor) query = query.contains("colors", [search.cor]);

      const { data, count, error } = await query;
      if (error) {
        console.error("Supabase query error:", error);
        throw error;
      }
      console.log("Fetched artworks count:", data?.length, "Total count:", count);
      return { artworks: data ?? [], count: count ?? 0 };
    },
  });

  useEffect(() => {
    console.log("Catalogo: Search params or page changed, refetching...", search, page);
    refetch();
  }, [search, page, refetch]);

  const update = useCallback((patch: Partial<CatalogSearch>) => {
    // Se estiver mudando filtros (não a página), reseta para a página 1
    const isOnlyPageChange = Object.keys(patch).length === 1 && 'page' in patch;
    const newSearch = { ...filters, ...patch };
    
    if (!isOnlyPageChange) {
      newSearch.page = 1;
    }

    if (patch.categoria) {
      const nextSlug = patch.categoria;
      const nextSearch = { ...newSearch };
      delete nextSearch.categoria;
      navigate({ to: "/catalogo/$slug", params: { slug: nextSlug }, search: nextSearch as any, replace: true });
      return;
    }

    navigate({ 
      to: "/catalogo", 
      search: newSearch as any,
      replace: true
    });

    if (isOnlyPageChange) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [filters, navigate]);

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        {currentCategory && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              "name": currentCategory.seo_title || currentCategory.name,
              "description": currentCategory.seo_description || currentCategory.description,
              "url": `https://estampaflix.com/catalogo/${currentCategory.slug}`,
              "image": currentCategory.cover_url,
              "breadcrumb": {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://estampaflix.com"
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Catálogo",
                    "item": "https://estampaflix.com/catalogo"
                  },
                  {
                    "@type": "ListItem",
                    "position": 3,
                    "name": currentCategory.name,
                    "item": `https://estampaflix.com/catalogo/${currentCategory.slug}`
                  }
                ]
              }
            })}
          </script>
        )}

        <header className="mb-5 sm:mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold sm:text-3xl md:text-4xl">
                {currentCategory?.name || t("catalog.title")}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {currentCategory?.description || t("catalog.subtitle")}
              </p>
            </div>
            {currentCategory?.cover_url && (
              <img 
                src={currentCategory.cover_url} 
                alt={currentCategory.cover_alt || currentCategory.name} 
                className="h-20 w-32 rounded-lg border border-border/40 object-cover shadow-lg md:h-24 md:w-40"
              />
            )}
          </div>
        </header>

        <form
          onSubmit={(e) => { e.preventDefault(); update({ q: q || undefined }); }}
          className="mb-4 flex gap-2 sm:mb-6"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("catalog.searchPlaceholder")} aria-label={t("catalog.searchPlaceholder")} className="pl-9" />
          </div>
          <Button type="submit" className="bg-gradient-brand text-brand-foreground">{t("catalog.search")}</Button>
        </form>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setFiltersOpen((v) => !v)}
          className="mb-4 w-full justify-center gap-2 lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {filtersOpen ? t("catalog.hideFilters") ?? "Ocultar filtros" : t("catalog.showFilters") ?? "Filtros"}
        </Button>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className={`${filtersOpen ? "block" : "hidden"} space-y-6 lg:block`}>
            <CatalogFilters filters={filters} categories={categories} formats={formats} onChange={update} onFilterSelected={() => setFiltersOpen(false)} />
          </aside>

          <div ref={resultsRef} className="scroll-mt-20">
            <CatalogResults
              filters={filters}
              artworks={artworks}
              count={count}
              page={page}
              itemsPerPage={ITEMS_PER_PAGE}
              isLoading={isLoading || isFetching}
              onRemoveFilter={(k) => update({ [k]: undefined } as any)}
              onPageChange={(p) => update({ page: p })}
              onClearFilters={() => navigate({ to: "/catalogo", search: {} as any, replace: true })}
            />
          </div>
        </div>

      </div>
    </SiteLayout>
  );
}
