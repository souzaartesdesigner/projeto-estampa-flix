import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { adminGrantOrderDownloads } from "@/lib/admin-artworks.functions";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatBRL, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, Copy, User, CreditCard, Package, Receipt, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/pedidos/$id")({ component: OrderDetail });

const STATUS_LABEL: Record<string, string> = {
  paid: "Pago",
  pending: "Pendente aguardando pagamento",
  canceled: "Cancelado",
  refunded: "Reembolsado",
  failed: "Falhou",
};

function OrderDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, artworks(id,title,slug)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["admin-order-profile", order?.user_id],
    enabled: !!order?.user_id,
    queryFn: async () => {
      const uid = order!.user_id;
      const [{ data: p }, { data: sub }, { data: customerOrders }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabase.from("subscriptions").select("*, plans(name, monthly_credits)").eq("user_id", uid).eq("status", "active").maybeSingle(),
        supabase.from("orders").select("id, order_number, amount_cents, status, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(10),
      ]);
      return { p, sub, customerOrders: customerOrders ?? [] };
    },
  });

  const markPaid = useMutation({
    mutationFn: async () => {
      // Primeiro atualiza o status para pago
      const { error: updateErr } = await supabase.from("orders").update({ 
        status: "paid", 
        paid_at: new Date().toISOString() 
      }).eq("id", id);
      if (updateErr) throw updateErr;

      // Chama a RPC para liberar os downloads para o CLIENTE do pedido
      await adminGrantOrderDownloads({ data: { orderId: id } });
    },
    onSuccess: () => { toast.success("Pedido marcado como pago e downloads liberados"); qc.invalidateQueries({ queryKey: ["admin-order", id] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase.from("orders").update({ status: newStatus as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, s) => { toast.success(`Status alterado para ${s}`); qc.invalidateQueries({ queryKey: ["admin-order", id] }); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-muted-foreground">Carregando…</p>;
  if (!order) return (
    <div>
      <p className="text-muted-foreground">Pedido não encontrado.</p>
      <Button asChild variant="outline" size="sm" className="mt-4"><Link to="/admin/vendas">Voltar</Link></Button>
    </div>
  );

  const items: any[] = Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : order.artwork_id ? [{ artwork_id: order.artwork_id, title: order.artworks?.title, price_cents: order.amount_cents + order.discount_cents }] : [];
  const subtotal = items.reduce((a, b) => a + (b.price_cents ?? 0), 0);

  const copy = (v?: string | null) => { if (!v) return; navigator.clipboard.writeText(v); toast.success("Copiado"); };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm"><Link to="/admin/vendas"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar</Link></Button>
        <h1 className="font-display text-2xl font-bold">Pedido #{order.order_number}</h1>
        <Badge variant={order.status === "paid" ? "default" : order.status === "pending" ? "secondary" : "outline"}>{STATUS_LABEL[order.status] ?? order.status}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Items */}
          <Card icon={<Package className="h-4 w-4" />} title="Itens do pedido">
            <ul className="divide-y divide-border/40">
              {items.map((it: any, i: number) => (
                <li key={i} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{it.title ?? "—"}</p>
                    <p className="text-xs text-muted-foreground font-mono">{it.artwork_id}</p>
                  </div>
                  <span className="text-sm font-medium">{formatBRL(it.price_cents ?? 0)}</span>
                </li>
              ))}
              {items.length === 0 && <li className="py-3 text-sm text-muted-foreground">Nenhum item registrado.</li>}
            </ul>
            <div className="mt-4 space-y-1 border-t border-border/40 pt-3 text-sm">
              <Row label="Subtotal" value={formatBRL(subtotal)} />
              {order.discount_cents > 0 && <Row label={`Desconto${order.coupon_code ? ` (${order.coupon_code})` : ""}`} value={`-${formatBRL(order.discount_cents)}`} />}
              <Row label="Total" value={formatBRL(order.amount_cents)} strong />
            </div>
          </Card>

          {/* Payment */}
          <Card icon={<CreditCard className="h-4 w-4" />} title="Pagamento">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Field label="Gateway" value={order.provider?.toUpperCase()} />
              <Field label="Status" value={STATUS_LABEL[order.status] ?? order.status} />
              <Field label="ID do pagamento" value={order.provider_payment_id ?? order.stripe_payment_id ?? "—"} copyable onCopy={() => copy(order.provider_payment_id ?? order.stripe_payment_id)} />
              <Field label="Pago em" value={order.paid_at ? formatDate(order.paid_at) : "—"} />
              <Field label="Criado em" value={formatDate(order.created_at)} />
              {order.pix_expires_at && <Field label="Pix expira em" value={formatDate(order.pix_expires_at)} />}
            </dl>
            {order.pix_qr_code && (
              <div className="mt-3 rounded-md border border-border/60 bg-surface-2 p-3">
                <p className="mb-1 text-xs uppercase text-muted-foreground">Pix copia e cola</p>
                <div className="flex items-start gap-2">
                  <code className="flex-1 break-all font-mono text-xs">{order.pix_qr_code}</code>
                  <Button size="sm" variant="outline" onClick={() => copy(order.pix_qr_code)}><Copy className="h-3 w-3" /></Button>
                </div>
              </div>
            )}
          </Card>

          {/* Actions */}
          <Card icon={<Receipt className="h-4 w-4" />} title="Ações administrativas">
            <div className="flex flex-wrap gap-2">
              {order.status !== "paid" && (
                <Button size="sm" onClick={() => markPaid.mutate()} disabled={markPaid.isPending}>
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Marcar como pago
                </Button>
              )}
              {order.status === "paid" && (
                <Button size="sm" variant="outline" onClick={() => setStatus.mutate("refunded")} disabled={setStatus.isPending}>
                  <RotateCcw className="mr-1 h-4 w-4" /> Marcar como reembolsado
                </Button>
              )}
              {order.status !== "canceled" && order.status !== "paid" && (
                <Button size="sm" variant="destructive" onClick={() => setStatus.mutate("canceled")} disabled={setStatus.isPending}>
                  <XCircle className="mr-1 h-4 w-4" /> Cancelar pedido
                </Button>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              "Marcar como pago" também libera automaticamente os downloads para o cliente.
            </p>
          </Card>
        </div>

        {/* Customer */}
        <div className="space-y-4">
          <Card icon={<User className="h-4 w-4" />} title="Cliente">
            <div className="space-y-2 text-sm">
              <p className="font-semibold">{profile?.p?.full_name ?? "—"}</p>
              <p className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3 w-3" /> {profile?.p?.email ?? "—"}</p>
              {profile?.p?.phone && <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3 w-3" /> {profile.p.phone}</p>}
              {profile?.p?.created_at && <p className="text-xs text-muted-foreground">Cadastrado em {formatDate(profile.p.created_at)}</p>}
              <p className="text-xs text-muted-foreground font-mono break-all">ID: {order.user_id}</p>
              <Button asChild size="sm" variant="outline" className="mt-2 w-full" onClick={() => navigate({ to: "/admin/usuarios" })}>
                <Link to="/admin/usuarios">Ver na lista de usuários</Link>
              </Button>
            </div>
          </Card>

          <Card icon={<CreditCard className="h-4 w-4" />} title="Assinatura ativa">
            {profile?.sub ? (
              <div className="text-sm space-y-1">
                <p className="font-medium">{profile.sub.plans?.name}</p>
                <p className="text-muted-foreground">{profile.sub.credits_remaining} / {profile.sub.plans?.monthly_credits ?? 0} créditos</p>
                <p className="text-xs text-muted-foreground">Renova {formatDate(profile.sub.current_period_end)}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sem assinatura ativa.</p>
            )}
          </Card>

          <Card icon={<Receipt className="h-4 w-4" />} title="Últimos pedidos deste cliente">
            <ul className="divide-y divide-border/40">
              {(profile?.customerOrders ?? []).map((o: any) => (
                <li key={o.id} className="flex items-center justify-between py-2 text-sm">
                  <Link to="/admin/pedidos/$id" params={{ id: o.id }} className="hover:text-primary">
                    <p className="font-mono text-xs">#{o.order_number}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(o.created_at)}</p>
                  </Link>
                  <div className="text-right">
                    <p>{formatBRL(o.amount_cents)}</p>
                    <Badge variant={o.status === "paid" ? "default" : "outline"} className="text-[10px]">{STATUS_LABEL[o.status] ?? o.status}</Badge>
                  </div>
                </li>
              ))}
              {(profile?.customerOrders ?? []).length === 0 && <li className="py-2 text-sm text-muted-foreground">Nenhum outro pedido.</li>}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ icon, title, children }: any) {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">{icon}<span>{title}</span></div>
      {children}
    </section>
  );
}
function Field({ label, value, copyable, onCopy }: any) {
  return (
    <div>
      <dt className="text-xs uppercase text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-2 break-all text-sm">
        <span>{value}</span>
        {copyable && value && value !== "—" && <button onClick={onCopy} className="text-muted-foreground hover:text-primary"><Copy className="h-3 w-3" /></button>}
      </dd>
    </div>
  );
}
function Row({ label, value, strong }: any) {
  return <div className={`flex justify-between ${strong ? "text-base font-semibold" : "text-muted-foreground"}`}><span>{label}</span><span>{value}</span></div>;
}
