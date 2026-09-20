import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Download, Link2, Loader2, Send, ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useUserSubscription } from "@/hooks/use-user-subscription";


import { createPixOrder } from "@/lib/mercadopago.functions";
import { useCart } from "@/hooks/use-cart";
import { formatBRL } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { trackBeginCheckout } from "@/lib/analytics";

type Props = {
  artwork: any;
  session: any;
  sub: any;
  owned: boolean | undefined;
  header?: React.ReactNode;
};

export function ArtworkActions({ artwork, session, sub, owned, header }: Props) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const cart = useCart();
  const inCart = cart.contains(artwork.id);
  const canDownload = !!sub && (sub.credits_remaining ?? 0) > 0;
  const isFree = artwork.license_type === "free";
  const hasActiveSub = !!sub;
  const { data: freeToday = 0 } = useQuery({
    queryKey: ["free-downloads-today", session?.user?.id],
    enabled: !!session && isFree && !hasActiveSub,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("free_downloads_today");
      if (error) return 0;
      return Number(data ?? 0);
    },
  });
  const freeLimitReached = isFree && !!session && !hasActiveSub && freeToday >= 2 && !owned;
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== "undefined" ? window.location.href : `https://estampaflix.com/artes/${artwork.slug}`;
  const shareUrlEnc = encodeURIComponent(shareUrl);
  const shareText = encodeURIComponent(`${artwork.title} — ${shareUrl}`);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(t("product.linkCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("product.copyLink"));
    }
  };

  const downloadMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("consume_download", { _artwork_id: artwork.id });
      if (error) throw error;
      const row: any = Array.isArray(data) ? data[0] : data;
      if (row?.external_url) {
        return { url: row.external_url as string, credits: row.credits_remaining, was_new: row.was_new, kind: "external" as const };
      }
      if (!row?.file_path) throw new Error(t("product.errFileUnavailable"));
      const { data: signed, error: sErr } = await supabase.storage
        .from("artwork-files")
        .createSignedUrl(row.file_path, 60, { download: true });
      if (sErr || !signed?.signedUrl) throw sErr ?? new Error(t("product.errFileUnavailable"));
      return { url: signed.signedUrl, credits: row.credits_remaining, was_new: row.was_new, kind: "file" as const };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["user-subscription"] });

      qc.invalidateQueries({ queryKey: ["free-downloads-today"] });
      if (res.kind === "external") {
        window.open(res.url, "_blank", "noopener,noreferrer");
      } else {
        const a = document.createElement("a");
        a.href = res.url;
        a.rel = "noopener";
        a.download = "";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      toast.success(res.was_new ? `${t("product.creditsReleased")} ${res.credits}` : t("product.alreadyDownloaded"));
    },
    onError: (err: any) => {
      const msg = err.message || "";
      if (msg.includes("daily_limit_reached")) toast.error("Você atingiu o limite de 2 downloads gratuitos hoje. Assine um plano para downloads ilimitados.");
      else if (msg.includes("no_credits")) toast.error(t("product.errNoCredits"));
      else if (msg.includes("no_active_subscription")) toast.error(t("product.errNoSub"));
      else if (msg.includes("not_authenticated")) { toast.error(t("product.errLogin")); navigate({ to: "/login" }); }
      else toast.error(msg || t("account.errDownload"));
    },
  });

  const createPix = useServerFn(createPixOrder);
  const buyMut = useMutation({
    mutationFn: async () => {
      if (!session) {
        navigate({ to: "/login" });
        throw new Error("not_authenticated");
      }
      trackBeginCheckout([artwork], artwork.price_cents);
      return await createPix({ data: { artworkId: artwork.id } });
    },
    onSuccess: (res) => {
      navigate({ to: "/pagamento/pix/$orderId", params: { orderId: res.orderId } });
    },
    onError: (err: any) => {
      if (err?.message === "not_authenticated") return;
      toast.error(err?.message || t("product.errStartPayment"));
    },
  });

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-medium text-success">
          <Zap className="h-3.5 w-3.5" /> {t("product.instantDelivery")}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <PixIcon /> {t("product.pixPayment")}
        </span>
      </div>

      {header}

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-black">{isFree ? "Grátis" : formatBRL(artwork.price_cents)}</span>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {isFree && !owned ? (
          <>
            <Button
              onClick={() => {
                if (!session) { navigate({ to: "/login" }); return; }
                if (freeLimitReached) { setPlanDialogOpen(true); return; }
                downloadMut.mutate();
              }}
              disabled={downloadMut.isPending}
              className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90"
            >
              <Download className="mr-2 h-4 w-4" />
              {downloadMut.isPending ? t("product.downloading") : "Baixar grátis"}
            </Button>
            {!session ? (
              <p className="text-center text-xs text-muted-foreground">
                Faça login para baixar esta arte gratuita.
              </p>
            ) : hasActiveSub ? (
              <p className="text-center text-xs text-success">Downloads gratuitos ilimitados com sua assinatura.</p>
            ) : (
              <p className={`text-center text-xs ${freeLimitReached ? "text-warning" : "text-muted-foreground"}`}>
                {freeLimitReached
                  ? "Limite diário atingido (2/2)."
                  : `${freeToday}/2 downloads gratuitos usados hoje.`}{" "}
                <Link to="/planos" className="text-primary underline">{t("product.seePlans")}</Link>
              </p>
            )}
          </>
        ) : session && owned ? (
          <>
            <Button
              onClick={() => downloadMut.mutate()}
              disabled={downloadMut.isPending}
              className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90"
            >
              <Download className="mr-2 h-4 w-4" />
              {downloadMut.isPending ? t("product.downloading") : t("product.download")}
            </Button>
            <p className="text-xs text-success">{t("product.owned")}</p>
          </>
        ) : (
          <>
            <Button
              onClick={() => (session && canDownload ? downloadMut.mutate() : setPlanDialogOpen(true))}
              disabled={downloadMut.isPending}
              className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90"
            >
              <Download className="mr-2 h-4 w-4" />
              {downloadMut.isPending
                ? t("product.downloading")
                : session && canDownload
                  ? `${t("product.download")} (${artwork.credit_cost ?? 1} ${t("product.creditsRemaining")})`
                  : t("product.downloadWithPlan")}
            </Button>
            {session && !sub && (
              <p className="text-center text-xs text-muted-foreground">
                {t("product.noSubscription")}{" "}
                <Link to="/planos" className="text-primary underline">
                  {t("product.seePlans")}
                </Link>
                .
              </p>
            )}
            {session && sub && !canDownload && (
              <p className="text-center text-xs text-warning">
                {t("product.noCredits")}{" "}
                <Link to="/planos" className="text-primary underline">
                  {t("product.upgrade")}
                </Link>
                .
              </p>
            )}

            <Button
              onClick={() => buyMut.mutate()}
              disabled={buyMut.isPending}
              size="lg"
              className="bg-primary text-primary-foreground shadow-brand ring-1 ring-primary/40 hover:bg-primary/90"
            >
              {buyMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              {t("product.buyPix")} ({formatBRL(artwork.price_cents)})
            </Button>

            <Button
              variant="outline"
              onClick={() => (inCart ? navigate({ to: "/carrinho" }) : cart.add(artwork))}
              disabled={cart.adding}
              className="border-border/60 bg-cart text-foreground hover:bg-cart-hover hover:text-foreground"
            >
              {inCart ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> {t("product.inCart")}
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" /> {t("product.addToCart")}
                </>
              )}
            </Button>
          </>
        )}
      </div>


      <div className="mt-5 border-t border-border/60 pt-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("product.shareThis")}
        </span>
        <div className="mt-2 flex items-center gap-2">
          <a
            href={`https://wa.me/?text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-muted/40 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <WhatsappIcon />
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrlEnc}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-muted/40 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <FacebookIcon />
          </a>
          <a
            href={`https://t.me/share/url?url=${shareUrlEnc}&text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-muted/40 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Send className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={copyLink}
            aria-label={t("product.copyLink")}
            className="flex h-9 items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-3 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
            {copied ? t("product.linkCopied") : t("product.copyLink")}
          </button>
        </div>
      </div>

      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{sub ? t("product.creditsDialogTitle") : t("product.planDialogTitle")}</DialogTitle>
            <DialogDescription>
              {sub ? t("product.creditsDialogBody") : t("product.planDialogBody")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => setPlanDialogOpen(false)}>
              {t("product.close")}
            </Button>
            <Button asChild className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90">
              <Link to="/planos">{sub ? t("product.upgrade") : t("product.seePlans")}</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function useArtworkSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => (await supabase.auth.getSession()).data.session,
  });
}

export function useMySubscription(userId: string | undefined) {
  return useUserSubscription(userId);
}


export function useArtworkOwnership(userId: string | undefined, artworkId: string) {
  return useQuery({
    queryKey: ["artwork-owned", userId, artworkId],
    enabled: !!userId,
    queryFn: async () => {
      const [dl, ord] = await Promise.all([
        supabase.from("downloads").select("id").eq("user_id", userId!).eq("artwork_id", artworkId).maybeSingle(),
        supabase.from("orders").select("id").eq("user_id", userId!).eq("artwork_id", artworkId).eq("status", "paid").maybeSingle(),
      ]);
      return !!(dl.data || ord.data);
    },
  });
}

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.5 9.5 0 0 1-4.83-1.32l-.35-.2-3.59.94.96-3.5-.23-.36a9.44 9.44 0 0 1-1.45-5.05c0-5.22 4.27-9.47 9.51-9.47a9.46 9.46 0 0 1 9.5 9.48c0 5.22-4.27 9.48-9.51 9.48M20.6 3.44A11.87 11.87 0 0 0 12.05 0C5.46 0 .1 5.34.1 11.9c0 2.1.55 4.14 1.6 5.95L0 24l6.34-1.65a11.98 11.98 0 0 0 5.7 1.45h.01c6.58 0 11.94-5.34 11.95-11.9a11.8 11.8 0 0 0-3.4-8.46"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07"/>
    </svg>
  );
}

function PixIcon() {
  return (
    <svg viewBox="0 0 512 512" className="h-3 w-3" fill="currentColor" aria-hidden="true">
      <path d="M242.4 292.5 189.6 345.3c-9.9 9.9-23.1 15.4-37.1 15.4h-10.4l66.7 66.7c20.8 20.8 54.6 20.8 75.4 0l67-67h-6.4c-14 0-27.2-5.5-37.1-15.4l-52.9-52.9c-3.4-3.4-9-3.4-12.4 0z"/>
      <path d="M152.5 151.3c14 0 27.2 5.5 37.1 15.4l52.9 52.9c3.4 3.4 9 3.4 12.4 0l52.8-52.8c9.9-9.9 23.1-15.4 37.1-15.4h6.4l-67-67c-20.8-20.8-54.6-20.8-75.4 0l-66.7 66.7h10.4z"/>
      <path d="m427.1 218.3-40.4-40.4c-.9.4-1.9.6-2.9.6h-29.1c-9.7 0-19.1 3.9-26 10.8l-52.8 52.8c-4.4 4.4-10.2 6.6-16 6.6s-11.6-2.2-16-6.6L191 189.2c-6.9-6.9-16.3-10.8-26-10.8h-35.8c-1 0-1.9-.2-2.7-.5l-40.6 40.6c-20.8 20.8-20.8 54.6 0 75.4l40.6 40.6c.8-.3 1.8-.5 2.7-.5H165c9.7 0 19.1-3.9 26-10.8l52.9-52.9c8.5-8.5 23.4-8.5 31.9 0l52.8 52.8c6.9 6.9 16.3 10.8 26 10.8h29.1c1 0 2 .2 2.9.6l40.4-40.4c20.9-20.8 20.9-54.6.1-75.4z"/>
    </svg>
  );
}
