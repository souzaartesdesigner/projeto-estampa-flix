import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = "https://estampaflix.com";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        let settings: any = null;
        try {
          const { data } = await (supabase as any)
            .from("site_settings")
            .select("sitemap_enabled, sitemap_extra_paths")
            .eq("id", true)
            .maybeSingle();
          settings = data;
        } catch {}

        if (settings && settings.sitemap_enabled === false) {
          return new Response(
            `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>`,
            { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=300" } },
          );
        }

        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/catalogo", changefreq: "daily", priority: "0.9" },
          { path: "/planos", changefreq: "weekly", priority: "0.9" },
          { path: "/gerador-catalogo", changefreq: "weekly", priority: "0.8" },
          { path: "/cadastro", changefreq: "monthly", priority: "0.8" },
          { path: "/login", changefreq: "monthly", priority: "0.7" },
          { path: "/esqueci-a-senha", changefreq: "yearly", priority: "0.3" },
          { path: "/blog", changefreq: "weekly", priority: "0.7" },
          { path: "/suporte", changefreq: "monthly", priority: "0.5" },
          { path: "/licenca", changefreq: "yearly", priority: "0.4" },
          { path: "/termos", changefreq: "yearly", priority: "0.3" },
          { path: "/privacidade", changefreq: "yearly", priority: "0.3" },
        ];

        for (const raw of String(settings?.sitemap_extra_paths ?? "").split("\n")) {
          const p = raw.trim();
          if (!p || !p.startsWith("/") || p === "/auth" || p.startsWith("/auth/")) continue;
          entries.push({ path: p, changefreq: "monthly", priority: "0.5" });
        }

        try {
          const { data: categories } = await supabase.from("categories").select("slug");
          for (const c of categories ?? []) {
            if (!c.slug) continue;
            entries.push({
              path: `/catalogo/${encodeURIComponent(c.slug)}`,
              changefreq: "weekly",
              priority: "0.8",
            });
          }
        } catch {}


        try {
          const { data: artworks } = await (supabase as any)
            .from("artworks")
            .select("slug, updated_at, noindex")
            .eq("is_published", true);
          for (const a of artworks ?? []) {
            if (a.noindex) continue;
            entries.push({ path: `/artes/${a.slug}`, lastmod: a.updated_at, changefreq: "weekly", priority: "0.6" });
          }
        } catch {}


        try {
          const { data: posts } = await supabase
            .from("blog_posts")
            .select("slug, updated_at")
            .eq("is_published", true);
          for (const p of posts ?? []) {
            entries.push({ path: `/blog/${p.slug}`, lastmod: p.updated_at, changefreq: "monthly", priority: "0.6" });
          }
        } catch {}


        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
