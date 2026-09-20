import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode, useMemo } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/lib/i18n";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta página não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado do nosso lado. Você pode tentar recarregar ou voltar ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Converte um snippet colado no admin (Google Analytics / Tag Manager)
 * em entradas de <script> aceitas pelo head() do TanStack Router.
 */
function parseHeadScripts(raw: string): Array<Record<string, any>> {
  const out: Array<Record<string, any>> = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  let found = false;
  while ((m = re.exec(raw))) {
    found = true;
    const attrs = m[1] ?? "";
    const body = (m[2] ?? "").trim();
    const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1];
    const entry: Record<string, any> = {};
    if (src) entry.src = src;
    if (/\basync\b/i.test(attrs)) entry.async = true;
    if (/\bdefer\b/i.test(attrs)) entry.defer = true;
    if (body) entry.children = body;
    if (entry.src || entry.children) out.push(entry);
  }
  if (!found && raw.trim()) out.push({ children: raw.trim() });
  return out;
}

const FALLBACK_TITLE = "Estampa Flix — Artes digitais para sublimação e DTF";
const FALLBACK_DESC =
  "Milhares de artes digitais em alta qualidade (300 DPI) para sublimação, DTF e estamparia. Assine e baixe novas estampas todo mês com licença comercial.";
const FALLBACK_OG_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8a36e287-6af7-46bc-9720-aead028ba808/id-preview-91e266b7--bb6fa90b-8f5d-47be-8009-cbab5c7a45fa.lovable.app-1784641090696.png";

type RootSeo = {
  siteName: string;
  title: string;
  description: string;
  keywords: string | null;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
      favicon: string;
      gsc: string | null;
      ga4: string | null;
      googleAdsId: string | null;
      googleAdsPurchaseLabel: string | null;
      metaPixelId: string | null;
      headScripts: string | null;
      bodyScripts: string | null;
    };

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async (): Promise<RootSeo> => {
    let s: any = null;
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await (supabase as any)
        .from("site_settings")
        .select(
          "site_name, favicon_url, seo_title, seo_description, seo_keywords, og_title, og_description, og_image_url, head_scripts, body_scripts, google_search_console_id, ga4_measurement_id, google_ads_id, google_ads_purchase_label, meta_pixel_id",
        )
        .eq("id", true)
        .maybeSingle();
      s = data;
    } catch {}

    const title = (s?.seo_title ?? "").trim() || FALLBACK_TITLE;
    const description = (s?.seo_description ?? "").trim() || FALLBACK_DESC;
    const siteName = (s?.site_name ?? "").trim() || "Estampa Flix";
    
    return {
      siteName,
      title,
      description,
      keywords: (s?.seo_keywords ?? "").trim() || null,
      ogTitle: (s?.og_title ?? "").trim() || title,
      ogDescription: (s?.og_description ?? "").trim() || description,
      ogImage: (s?.og_image_url ?? "").trim() || FALLBACK_OG_IMAGE,
      favicon: (s?.favicon_url ?? "").trim() || "/favicon.png",
      gsc: (s?.google_search_console_id ?? "").trim() || null,
      ga4: (s?.ga4_measurement_id ?? "").trim() || null,
      googleAdsId: (s?.google_ads_id ?? "").trim() || null,
      googleAdsPurchaseLabel: (s?.google_ads_purchase_label ?? "").trim() || null,
      metaPixelId: (s as any)?.meta_pixel_id || null,
      headScripts: (s?.head_scripts ?? "").trim() || null,
      bodyScripts: (s?.body_scripts ?? "").trim() || null,
    };
  },
  head: ({ loaderData }) => {
    const d: RootSeo = loaderData ?? {
      siteName: "Estampa Flix",
      title: FALLBACK_TITLE,
      description: FALLBACK_DESC,
      keywords: null,
      ogTitle: FALLBACK_TITLE,
      ogDescription: FALLBACK_DESC,
      ogImage: FALLBACK_OG_IMAGE,
      favicon: "/favicon.png",
      gsc: null,
      ga4: null,
      googleAdsId: null,
      googleAdsPurchaseLabel: null,
      metaPixelId: null,
      headScripts: null,
      bodyScripts: null,
    };

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: d.title },
        { name: "description", content: d.description },
        ...(d.keywords ? [{ name: "keywords", content: d.keywords }] : []),
        ...(d.gsc ? [{ name: "google-site-verification", content: d.gsc }] : []),
        { property: "og:title", content: d.ogTitle },
        { property: "og:description", content: d.ogDescription },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: d.siteName },
        
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: d.ogTitle },
        { name: "twitter:description", content: d.ogDescription },
        { property: "og:image", content: d.ogImage },
        { name: "twitter:image", content: d.ogImage },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        { rel: "preconnect", href: "https://tkzkespxrbgudujvuecq.supabase.co", crossOrigin: "anonymous" },
        { rel: "preconnect", href: "https://wsrv.nl", crossOrigin: "anonymous" },
        { rel: "dns-prefetch", href: "https://wsrv.nl" },
        { rel: "dns-prefetch", href: "https://tkzkespxrbgudujvuecq.supabase.co" },
        { rel: "dns-prefetch", href: "https://estampaflix.com" },
        { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&family=Sora:wght@700;800&display=swap" },

        { rel: "icon", type: "image/png", href: d.favicon },
      ],
      scripts: [
        // DO NOT REMOVE — Google Tag Manager (GTM-594LSV6J) head script
        {
          children:
            "(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-594LSV6J');",
        },
        // END DO NOT REMOVE — GTM
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                name: d.siteName,
                url: "https://estampaflix.com/",
                logo: d.ogImage,
              },
              {
                "@type": "WebSite",
                name: d.siteName,
                url: "https://estampaflix.com/",
                potentialAction: {
                  "@type": "SearchAction",
                  target: "https://estampaflix.com/catalogo?q={search_term_string}",
                  "query-input": "required name=search_term_string",
                },
              },
            ],
          }),
        },
        ...(d.headScripts ? parseHeadScripts(d.headScripts) : []),
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const loaderData = Route.useLoaderData();
  
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {/* DO NOT REMOVE — Google Tag Manager (GTM-594LSV6J) noscript iframe */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-594LSV6J"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* END DO NOT REMOVE — GTM noscript */}
        {loaderData?.bodyScripts && (
          <div dangerouslySetInnerHTML={{ __html: loaderData.bodyScripts }} />
        )}
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const loaderData = Route.useLoaderData();

  useEffect(() => {
    if (loaderData?.ga4 || loaderData?.metaPixelId) {
      import("@/lib/analytics-loader").then(m => {
        m.loadAnalytics(loaderData.ga4, loaderData.metaPixelId);
      });
    }
  }, [loaderData?.ga4, loaderData?.metaPixelId]);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <Outlet />
        <Toaster richColors position="top-right" />
      </I18nProvider>
    </QueryClientProvider>
  );
}

