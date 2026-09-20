import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/use-cart";
import { createPixOrder, validateCouponFn } from "@/lib/mercadopago.functions";
import { formatBRL } from "@/lib/format";
import { Trash2, ShoppingBag, Loader2, Tag, X, Check } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { CartUpsell } from "@/features/cart/cart-upsell";
import { useEffect } from "react";
import { trackBeginCheckout } from "@/lib/analytics";

export const Route = createFileRoute("/_authenticated/carrinho")({
  head: () => ({ meta: [{ title: "Carrinho — Estampa Flix" }, { name: "robots", content: "noindex" }] }),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const createPix = useServerFn(createPixOrder);
  const validateCoupon = useServerFn(validateCouponFn);
  const { t } = useI18n();


  const [couponInput, setCouponInput] = useState("");
  const [applied, setApplied] = useState<{ code: string; discountCents: number } | null>(null);

  function couponError(msg: string) {
    const map: Record<string, string> = {
      invalid_code: t("cart.couponInvalid"),
      expired: t("cart.couponExpired"),
      exhausted: t("cart.couponExhausted"),
      wrong_scope: t("cart.couponScope"),
      already_used: t("cart.couponUsed"),
      not_authenticated: t("cart.notAuth"),
    };
    return map[msg] || t("cart.couponInvalid");
  }

  const applyMut = useMutation({
    mutationFn: async () => {
      const code = couponInput.trim();
      if (!code) throw new Error(t("cart.enterCoupon"));
      const res = await validateCoupon({ data: { code, scope: "pix", subtotalCents: cart.total } });
      if (!res.valid) throw new Error(couponError(res.message));
      return { code, discountCents: res.discountCents };
    },
    onSuccess: (v) => {
      setApplied(v);
      toast.success(`${t("cart.couponApplied")} -${formatBRL(v.discountCents)}`);
    },
    onError: (e: any) => toast.error(e?.message || t("cart.couponInvalid")),
  });

  const checkoutMut = useMutation({
    mutationFn: async () => {
      trackBeginCheckout(cart.items, cart.total);
      return await createPix({ data: { cartCheckout: true, couponCode: applied?.code ?? null } });
    },
    onSuccess: (r) => navigate({ to: "/pagamento/pix/$orderId", params: { orderId: r.orderId } }),
    onError: (e: any) => toast.error(e?.message || t("cart.errPix")),
  });

  const total = Math.max(0, cart.total - (applied?.discountCents ?? 0));

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-5xl px-3 py-6 sm:px-4 sm:py-10">
        <h1 className="mb-5 font-display text-2xl font-bold sm:mb-6 sm:text-3xl">{t("cart.title")}</h1>

        {cart.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">{t("cart.empty")}</p>
            <Button asChild className="mt-4"><Link to="/catalogo" search={{ page: 1 }}>{t("account.exploreCatalog")}</Link></Button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr,340px]">
            <div className="space-y-3">
              {cart.items.map((it) => (
                <div key={it.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-2.5 sm:gap-4 sm:p-3">
                  <Link to="/artes/$slug" params={{ slug: it.artworks!.slug }} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-2 sm:h-20 sm:w-20">
                    <img src={it.artworks!.preview_url} alt={it.artworks!.title} className="h-full w-full object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link to="/artes/$slug" params={{ slug: it.artworks!.slug }} className="line-clamp-2 text-sm font-medium hover:text-primary sm:text-base">
                      {it.artworks!.title}
                    </Link>
                    <p className="mt-1 text-sm font-semibold text-primary">{formatBRL(it.artworks!.price_cents)}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => cart.remove(it.id)} aria-label={t("cart.remove")}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <aside className="h-fit rounded-xl border border-border/60 bg-card p-5">
              <h2 className="font-semibold">{t("cart.summary")}</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">{t("cart.subtotal")} ({cart.count} {cart.count === 1 ? t("cart.item") : t("cart.items")})</dt><dd>{formatBRL(cart.total)}</dd></div>
                {applied && (
                  <div className="flex justify-between text-success">
                    <dt>{t("cart.coupon")} {applied.code}</dt>
                    <dd>-{formatBRL(applied.discountCents)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-border/40 pt-2 text-base font-bold"><dt>{t("cart.total")}</dt><dd className="text-primary">{formatBRL(total)}</dd></div>
              </dl>

              <div className="mt-4">
                {applied ? (
                  <div className="flex items-center justify-between rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm">
                    <span className="flex items-center gap-1"><Check className="h-4 w-4" /> {applied.code}</span>
                    <button aria-label={t("cart.removeCoupon")} onClick={() => setApplied(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input placeholder={t("cart.coupon")} value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} className="pl-8" />
                    </div>
                    <Button variant="outline" onClick={() => applyMut.mutate()} disabled={applyMut.isPending}>
                      {applyMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("cart.apply")}
                    </Button>
                  </div>
                )}
              </div>

              <Button
                onClick={() => checkoutMut.mutate()}
                disabled={checkoutMut.isPending}
                className="mt-4 w-full bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90"
              >
                {checkoutMut.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("cart.generatingPix")}</> : t("cart.checkoutPix")}
              </Button>
              <Button variant="ghost" className="mt-2 w-full text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => cart.clear()}>{t("cart.clear")}</Button>
            </aside>
          </div>
        )}

        {cart.items.length > 0 && (
          <div className="mt-8">
            <CartUpsell />
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
