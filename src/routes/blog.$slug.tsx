import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site-layout";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useI18n, tField } from "@/lib/i18n";
import { SmartImage } from "@/components/smart-image";
import { HERO_WIDTHS } from "@/lib/image-cdn";


export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase.from("blog_posts").select("*").eq("slug", params.slug).eq("is_published", true).maybeSingle();
    if (!data) throw notFound();
    return data;
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Artigo não encontrado" }, { name: "robots", content: "noindex" }] };
    const url = `https://estampaflix.com/blog/${params.slug}`;
    
    const title = loaderData.seo_title || `${loaderData.title} — Estampa Flix Blog`;
    const description = loaderData.seo_description || (loaderData.excerpt && loaderData.excerpt.length >= 50
      ? loaderData.excerpt
      : `${loaderData.title} — leia no blog da Estampa Flix dicas, tutoriais e novidades sobre sublimação, DTF e produção criativa.`);
    const keywords = loaderData.seo_keyword || "";

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "keywords", content: keywords },
        { property: "og:title", content: title },
        { property: "og:description", content: description.slice(0, 200) },
        { property: "og:image", content: loaderData.cover_url ?? "" },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: loaderData.title,
            alternativeHeadline: title,
            image: loaderData.cover_url ? [loaderData.cover_url] : undefined,
            datePublished: loaderData.published_at,
            dateModified: loaderData.updated_at,
            author: { "@type": "Person", name: loaderData.author_name },
            publisher: { 
              "@type": "Organization", 
              name: "Estampa Flix",
              logo: {
                "@type": "ImageObject",
                url: "https://estampaflix.com/favicon.png"
              }
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": url
            },
            description,
          }),
        },
      ],
    };
  },
  component: Post,
  notFoundComponent: NotFound,
  errorComponent: () => <SiteLayout><div className="p-12 text-center">Erro</div></SiteLayout>,
});

function NotFound() {
  const { t } = useI18n();
  return (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">{t("blog.notFound")}</h1>
        <Button asChild className="mt-6"><Link to="/blog">{t("blog.back")}</Link></Button>
      </div>
    </SiteLayout>
  );
}

function Post() {
  const post = Route.useLoaderData();
  const { t, lang } = useI18n();
  const title = tField(post as any, "title", lang) || post.title;
  const content = tField(post as any, "content", lang) || post.content;
  return (
    <SiteLayout>
      <article className="mx-auto w-full max-w-3xl px-4 py-12">
        <Link to="/blog" className="text-sm text-primary hover:underline">{t("blog.back")}</Link>
        <header className="mt-4">
          <h1 className="font-display text-4xl font-black leading-tight md:text-5xl">{title}</h1>
          <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
            <span>{post.author_name}</span>
            <span>•</span>
            <span>{formatDate(post.published_at)}</span>
          </div>
        </header>
        {post.cover_url && (
          <div className="my-8 overflow-hidden rounded-2xl border border-border/60">
            <SmartImage src={post.cover_url} alt={post.cover_alt || title} widths={HERO_WIDTHS} fallbackWidth={960} sizes="(max-width: 900px) 100vw, 860px" priority className="w-full" />
          </div>
        )}
        <div className="prose prose-invert max-w-none whitespace-pre-wrap text-foreground/90 leading-relaxed">
          {content}
        </div>
      </article>
    </SiteLayout>
  );
}
