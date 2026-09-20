import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_ROBOTS = `User-agent: *
Allow: /

Disallow: /admin
Disallow: /minha-conta
Disallow: /carrinho
Disallow: /login
Disallow: /cadastro
Disallow: /esqueci-a-senha
Disallow: /reset-password
Disallow: /pagamento
Disallow: /lovable/

Sitemap: https://estampaflix.com/sitemap.xml`;

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        let body = DEFAULT_ROBOTS;
        try {
          const { data } = await (supabase as any)
            .from("site_settings")
            .select("robots_txt")
            .eq("id", true)
            .maybeSingle();
          const custom = (data?.robots_txt ?? "").trim();
          if (custom) body = custom;
        } catch {}

        return new Response(`${body}\n`, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
