import { Link } from "@tanstack/react-router";
import { Check, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { SectionTitle } from "./section-title";

export function PlansSection({ plans }: { plans: any[] }) {
  const { t } = useI18n();
  return (
    <section className="relative mx-auto w-full max-w-7xl px-4 py-14 sm:py-20">
      <SectionTitle title={t("home.plansTitle")} subtitle={t("home.plansSubtitle")} center />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {plans.map((plan, idx) => {
          const highlighted = idx === 1;
          return (
            <div
              key={plan.id}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 sm:p-7 ${
                highlighted
                  ? "border-primary/60 bg-gradient-to-b from-card to-surface shadow-brand sm:col-span-2 lg:col-span-1"
                  : "border-border/60 bg-card shadow-card hover:border-primary/40"
              }`}
            >
              {highlighted && (
                <>
                  <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
                  <Badge className="absolute right-4 top-4 border-0 bg-gradient-brand text-brand-foreground shadow-glow">
                    {t("home.popular")}
                  </Badge>
                </>
              )}
              <h3 className="font-display text-xl font-bold tracking-tight">{plan.name}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-4xl font-black tracking-tight sm:text-5xl">{formatBRL(plan.price_cents)}</span>
                <span className="text-sm text-muted-foreground">{t("plans.perMonth")}</span>
              </div>
              <div className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-primary/20">
                <Zap className="h-3 w-3" /> {plan.monthly_credits} {t("plans.downloadsPerMonth")}
              </div>
              <ul className="mt-6 flex flex-1 flex-col gap-2.5 text-sm">
                {(plan.features as string[]).map((f: string) => (
                  <li key={f} className="flex items-start gap-2.5 text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={`mt-7 h-11 rounded-full transition-transform hover:-translate-y-0.5 ${
                  highlighted
                    ? "bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-95"
                    : "bg-surface-2 text-foreground hover:bg-primary hover:text-primary-foreground"
                }`}
              >
                <Link to="/planos">{t("home.subscribe")} {plan.name}</Link>
              </Button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
