import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { SiteLayout } from "@/components/site-layout";
 import { formatDate } from "@/lib/format";
 import { useI18n, tField } from "@/lib/i18n";
 import { useSiteSettings } from "@/hooks/use-site-settings";


const blogQuery = queryOptions({
  queryKey: ["blog-list"],
  queryFn: async () => (await supabase.from("blog_posts").select("id,slug,title,excerpt,cover_url,author_name,published_at,translations").eq("is_published", true).order("published_at", { ascending: false })).data ?? [],
});

export const Route = createFileRoute("/blog/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(blogQuery),
  head: () => {
    const { data: settings } = useSiteSettings();
    const title = settings?.blog_seo_title || "Blog de sublimação e estamparia — Estampa Flix";
    const description = settings?.blog_seo_description || "Dicas, tutoriais e novidades sobre sublimação, DTF e artes digitais: como imprimir, escolher tecidos, precificar e vender produtos personalizados.";
    const keywords = settings?.blog_seo_keyword || "blog sublimação, tutorial DTF, como sublimar, estamparia digital, artes digitais";

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "keywords", content: keywords },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "https://estampaflix.com/blog" },
      ],
      links: [{ rel: "canonical", href: "https://estampaflix.com/blog" }],
    };
  },
  component: Blog,
});

function Blog() {
  const { data: posts } = useSuspenseQuery(blogQuery);
  const { t, lang } = useI18n();
  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <header className="mb-8">
          <h1 className="font-display text-4xl font-black">{t("blog.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("blog.subtitle")}</p>
        </header>
        {posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-12 text-center text-muted-foreground">{t("blog.empty")}</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((p: any) => {
              const title = tField(p, "title", lang) || p.title;
              const excerpt = tField(p, "excerpt", lang) || p.excerpt;
              return (
                <Link key={p.id} to="/blog/$slug" params={{ slug: p.slug }} className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:-translate-y-1 hover:border-primary/50">
                  <div className="aspect-video overflow-hidden bg-surface-2">
                    {p.cover_url ? <img src={p.cover_url} alt={title} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform group-hover:scale-105" /> : <div className="grid h-full place-items-center text-muted-foreground">{t("card.noImage")}</div>}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <h2 className="font-display text-lg font-bold leading-tight">{title}</h2>
                    {excerpt && <p className="line-clamp-3 text-sm text-muted-foreground">{excerpt}</p>}
                    <div className="mt-auto flex items-center justify-between pt-3 text-xs text-muted-foreground">
                      <span>{p.author_name}</span>
                      <span>{formatDate(p.published_at)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
