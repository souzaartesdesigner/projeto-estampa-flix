import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { PlansLanding } from "@/features/plans/plans-landing";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/format";
import { createCheckoutSession } from "@/lib/stripe.functions";
import { toast } from "sonner";
import { Check, Zap, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { trackBeginCheckout } from "@/lib/analytics";
import { useReveal } from "@/hooks/use-reveal";


const plansQuery = queryOptions({
  queryKey: ["plans"],
  queryFn: async () => (await supabase.from("plans").select("*").eq("is_active", true).order("sort_order")).data ?? [],
});

export const Route = createFileRoute("/planos")({
  loader: async ({ context }) => {
    const settings = await context.queryClient.ensureQueryData({
      queryKey: ["site-settings"],
      queryFn: async () => {
        const { data } = await (supabase as any).from("site_settings").select("*").eq("id", true).maybeSingle();
        return data;
      },
    });
    const plans = await context.queryClient.ensureQueryData(plansQuery);
    return { settings, plans };
  },
  head: ({ loaderData }) => {
    const settings = (loaderData as any)?.settings;
    const title = settings?.plans_seo_title || "Planos de assinatura — Estampa Flix";
    const description = settings?.plans_seo_description || "Compare os planos Lite, Pro e Plus da Estampa Flix: créditos mensais para baixar artes digitais em alta resolução, licença comercial e cancelamento a qualquer momento.";
    const keywords = settings?.plans_seo_keyword || settings?.seo_keywords || "assinatura de artes para sublimação, planos de estampas digitais, pacote de artes DTF, créditos para download";

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "keywords", content: keywords },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: "https://estampaflix.com/planos" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: "https://estampaflix.com/planos" }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "Assinatura Estampa Flix",
            description: "Acesso a biblioteca de artes digitais para sublimação e DTF.",
            brand: {
              "@type": "Brand",
              name: "Estampa Flix",
            },
            offers: {
              "@type": "AggregateOffer",
              offerCount: "3",
              lowPrice: "29.90",
              highPrice: "99.90",
              priceCurrency: "BRL",
            },
          }),
        },
      ],
    };
  },
  component: Planos,
});

function Planos() {
  const { data: plans } = useSuspenseQuery(plansQuery);
  const checkoutFn = useServerFn(createCheckoutSession);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const plansRef = useRef<HTMLDivElement | null>(null);
  const { t } = useI18n();
  useReveal();


  async function handleSubscribe(planId: string) {
    setLoadingId(planId);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        window.location.href = `/login?redirect=${encodeURIComponent("/planos")}`;
        return;
      }
      const plan = plans.find(p => p.id === planId);
      if (plan) {
        trackBeginCheckout([{
          item_id: plan.id,
          item_name: plan.name,
          price: plan.price_cents / 100,
          quantity: 1
        }], plan.price_cents);
      }
      const { url } = await checkoutFn({ data: { planId } });
      if (url) window.location.href = url;
      else throw new Error(t("plans.checkoutUrlMissing"));
    } catch (err: any) {
      toast.error(err?.message ?? t("plans.checkoutError"));
      setLoadingId(null);
    }
  }

  return (
    <SiteLayout>
      <section className="relative">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 text-center sm:py-16">
          <Badge className="mb-4 animate-fade-in bg-primary/15 text-primary border-primary/30">{t("plans.badge")}</Badge>
          <h1 className="animate-fade-in font-display text-3xl font-black sm:text-4xl md:text-5xl">
            Junte-se ao <span className="text-primary">Premium</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl animate-fade-in text-sm text-muted-foreground sm:text-base">{t("plans.subtitle")}</p>
        </div>
      </section>

      <section ref={plansRef} className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-3 py-8 sm:px-4 sm:py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, idx) => (
            <div
              key={plan.id}
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
                e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
              }}
              style={{ transitionDelay: `${idx * 90}ms` }}
              className={`plan-card reveal-on-scroll relative flex flex-col rounded-2xl border p-5 sm:p-6 ${
                idx === 1 ? "border-primary/60 bg-gradient-to-b from-card to-surface shadow-brand" : "border-border/60 bg-card"
              }`}
            >
              {idx === 1 && (
                <Badge className="absolute right-4 top-4 bg-gradient-brand text-brand-foreground border-0 shadow-glow"><Zap className="mr-1 h-3 w-3" /> {t("plans.popular")}</Badge>
              )}
              <h2 className="font-display text-xl font-bold">{plan.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-4 flex flex-wrap items-baseline gap-1">
                <span className="text-3xl font-black sm:text-4xl">{formatBRL(plan.price_cents)}</span>
                <span className="text-sm text-muted-foreground">{t("plans.perMonth")}</span>
              </div>
              <div className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary ring-1 ring-primary/20">
                <Zap className="h-3.5 w-3.5" /> {plan.monthly_credits} {t("plans.downloadsPerMonth")}
              </div>
              <ul className="mt-4 flex flex-1 flex-col gap-2 text-sm">
                {(Array.isArray(plan.features) ? (plan.features as string[]) : []).map((f: string) => (
                  <li key={f} className="flex items-start gap-2 transition-transform duration-200 hover:translate-x-1">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loadingId !== null}
                className="mt-6 bg-gradient-brand text-brand-foreground shadow-brand transition-transform hover:-translate-y-0.5 hover:opacity-90"
              >
                {loadingId === plan.id ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("plans.redirecting")}</>
                ) : (
                  t("plans.subscribeNow")
                )}
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">{t("plans.securePayment")}</p>
            </div>
          ))}
        </div>


        <div className="reveal-on-scroll mt-16 rounded-2xl border border-border/60 bg-gradient-to-b from-card to-surface p-8">
          <h2 className="font-display text-2xl font-bold">{t("plans.howTitle")}</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              { title: t("plans.step1Title"), desc: t("plans.step1Desc") },
              { title: t("plans.step2Title"), desc: t("plans.step2Desc") },
              { title: t("plans.step3Title"), desc: t("plans.step3Desc") },
            ].map((s, i) => (
              <div key={s.title} className="reveal-on-scroll" style={{ transitionDelay: `${i * 90}ms` }}>
                <h3 className="font-semibold text-primary">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </section>

      <PlansLanding
        onScrollToPlans={() => plansRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
      />
    </SiteLayout>
  );
}

// Link import kept in case future navigation is added
void Link;
