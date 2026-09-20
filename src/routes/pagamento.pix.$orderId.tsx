import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { checkPixOrder } from "@/lib/mercadopago.functions";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { formatBRL } from "@/lib/format";
import { Copy, Check, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trackPurchase, trackBeginCheckout } from "@/lib/analytics";

export const Route = createFileRoute("/pagamento/pix/$orderId")({
  head: () => ({
    meta: [
      { title: "Pagamento Pix — Estampa Flix" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PixCheckoutPage,
});

function PixCheckoutPage() {
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();
  const check = useServerFn(checkPixOrder);
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["pix-order", orderId],
    queryFn: () => check({ data: { orderId } }),
    refetchInterval: (q) => {
      const s = (q.state.data as any)?.status;
      return s === "pending" ? 4000 : false;
    },
    refetchOnWindowFocus: true,
  });

  const status = (data as any)?.status as
    | "pending"
    | "paid"
    | "failed"
    | "refunded"
    | undefined;

  const expiresAt = (data as any)?.pix_expires_at as string | undefined;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const timeLeft = useMemo(() => {
    if (!expiresAt) return null;
    const ms = new Date(expiresAt).getTime() - now;
    if (ms <= 0) return "expirado";
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, [expiresAt, now]);

  const [purchaseTracked, setPurchaseTracked] = useState(false);

  useEffect(() => {
    if (status === "paid" && data && !purchaseTracked) {
      console.log("Pagamento confirmado, iniciando redirecionamento...");
      setPurchaseTracked(true);
      
      const orderData = data as any;
      const items = orderData.items ? orderData.items : (orderData.artworks ? [orderData.artworks] : []);
      trackPurchase(orderId, items, orderData.amount_cents || 0);

      toast.success("Pagamento confirmado! Redirecionando...", {
        duration: 3000,
      });

      // Redireciona imediatamente
      navigate({ 
        to: "/minha-conta", 
        search: { tab: "downloads" },
        replace: true 
      });
    }
  }, [status, data, orderId, navigate, purchaseTracked]);

  const qrCode = (data as any)?.pix_qr_code as string | undefined;
  const qrCodeBase64 = (data as any)?.pix_qr_code_base64 as string | undefined;
  const amount = (data as any)?.amount_cents as number | undefined;
  const title = (data as any)?.artworks?.title as string | undefined;

  const copyCode = async () => {
    if (!qrCode) return;
    await navigator.clipboard.writeText(qrCode);
    setCopied(true);
    toast.success("Código Pix copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">Pagamento via Pix</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {title ? `Compra: ${title}` : "Aguardando dados do pedido..."}
        </p>

        {isLoading && (
          <div className="mt-8 flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-xl border border-destructive/40 bg-destructive/5 p-6">
            <p className="text-sm text-destructive">
              Não foi possível carregar este pedido.
            </p>
            <Button asChild className="mt-4" variant="outline">
              <Link to="/catalogo" search={{ page: 1 }}>Voltar ao catálogo</Link>
            </Button>
          </div>
        )}

        {status === "paid" && (
          <div className="mt-8 flex items-center gap-3 rounded-xl border border-success/40 bg-success/5 p-6">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <div>
              <p className="font-semibold">Pagamento confirmado!</p>
              <p className="text-sm text-muted-foreground">
                Redirecionando para a sua arte...
              </p>
            </div>
          </div>
        )}

        {(status === "failed" || status === "refunded") && (
          <div className="mt-8 flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-6">
            <XCircle className="h-8 w-8 text-destructive" />
            <div className="flex-1">
              <p className="font-semibold">Pagamento não concluído</p>
              <p className="text-sm text-muted-foreground">
                Você pode tentar novamente pelo catálogo.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/catalogo" search={{ page: 1 }}>Catálogo</Link>
            </Button>
          </div>
        )}

        {status === "pending" && qrCode && (
          <div className="mt-6 grid gap-6 rounded-2xl border border-border/60 bg-card p-6 md:grid-cols-[240px_1fr]">
            <div className="flex flex-col items-center gap-3">
              {qrCodeBase64 ? (
                <img
                  src={`data:image/png;base64,${qrCodeBase64}`}
                  alt="QR Code Pix"
                  className="h-56 w-56 rounded-lg border border-border bg-white p-2"
                />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center rounded-lg border border-border bg-muted text-xs text-muted-foreground">
                  Gerando QR...
                </div>
              )}
              {timeLeft && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> Expira em {timeLeft}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Valor
                </div>
                <div className="text-3xl font-black">
                  {amount ? formatBRL(amount) : "—"}
                </div>
              </div>

              <ol className="space-y-1 text-sm text-muted-foreground">
                <li>1. Abra o app do seu banco.</li>
                <li>2. Escaneie o QR ou cole o código Pix Copia e Cola.</li>
                <li>3. Confirme o pagamento — liberamos automaticamente.</li>
              </ol>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pix Copia e Cola
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    readOnly
                    value={qrCode}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 truncate rounded-md border border-border bg-background px-3 py-2 text-xs"
                  />
                  <Button size="sm" variant="outline" aria-label="Copiar código Pix" onClick={copyCode}>
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Aguardando pagamento... verificamos a cada 4 segundos.
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.invalidate()}
              >
                Atualizar agora
              </Button>
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
