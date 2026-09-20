import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { formatBRL, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Eye, Search, ShoppingBag, CreditCard, TrendingUp, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cleanupExpiredOrders } from "@/lib/orders-maintenance.functions";



export const Route = createFileRoute("/_authenticated/admin/vendas")({ component: Vendas });

const STATUS_LABEL: Record<string, string> = {
  paid: "Pago",
  pending: "Pendente",
  canceled: "Cancelado",
  refunded: "Reembolsado",
  failed: "Falhou",
};

function Vendas() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const [status, setStatus] = useState<string>("all");
  const [provider, setProvider] = useState<string>("all");
  const [tab, setTab] = useState<"orders" | "subs">("orders");

  const { data } = useQuery({
    queryKey: ["admin-sales-v2"],
    queryFn: async () => {
      const [{ data: orders }, { data: subs }, { data: profiles }] = await Promise.all([
        supabase
          .from("orders")
          .select("id, order_number, user_id, artwork_id, amount_cents, discount_cents, coupon_code, status, provider, provider_payment_id, stripe_payment_id, paid_at, created_at, items, artworks(title)")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.from("subscriptions").select("*, plans(name,price_cents,monthly_credits)").order("created_at", { ascending: false }).limit(200),
        supabase.from("profiles").select("id,email,full_name,phone"),
      ]);
      const pmap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      return {
        orders: (orders ?? []).map((o: any) => ({ ...o, profile: pmap.get(o.user_id) })),
        subs: (subs ?? []).map((s: any) => ({ ...s, profile: pmap.get(s.user_id) })),
      };
    },
  });

  const orders = data?.orders ?? [];
  const subs = data?.subs ?? [];

  const filteredOrders = useMemo(() => {
    return orders.filter((o: any) => {
      if (status !== "all" && o.status !== status) return false;
      if (provider !== "all" && o.provider !== provider) return false;
      if (!q) return true;
      const term = q.toLowerCase();
      return (
        String(o.order_number ?? "").includes(term) ||
        o.profile?.email?.toLowerCase().includes(term) ||
        o.profile?.full_name?.toLowerCase().includes(term) ||
        o.artworks?.title?.toLowerCase().includes(term) ||
        o.provider_payment_id?.toLowerCase().includes(term) ||
        o.stripe_payment_id?.toLowerCase().includes(term) ||
        o.coupon_code?.toLowerCase().includes(term)
      );
    });
  }, [orders, q, status, provider]);

  const paidOrders = orders.filter((o: any) => o.status === "paid");
  const pendingOrders = orders.filter((o: any) => o.status === "pending");
  const orderRev = paidOrders.reduce((a: number, b: any) => a + b.amount_cents, 0);
  const subRev = subs.filter((s: any) => s.status === "active").reduce((a: number, b: any) => a + (b.plans?.price_cents ?? 0), 0);
  const avgTicket = paidOrders.length ? Math.round(orderRev / paidOrders.length) : 0;

  const cleanup = useMutation({
    mutationFn: async () => await cleanupExpiredOrders(),

    onSuccess: () => {
      toast.success("Pedidos expirados foram cancelados");
      qc.invalidateQueries({ queryKey: ["admin-sales-v2"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Pedidos & Vendas</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => cleanup.mutate()}
          disabled={cleanup.isPending}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Limpar PIX Expirados
        </Button>
      </div>


      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={<ShoppingBag className="h-4 w-4" />} label="Receita avulsa" value={formatBRL(orderRev)} />
        <Metric icon={<CreditCard className="h-4 w-4" />} label="MRR assinaturas" value={formatBRL(subRev)} />
        <Metric icon={<TrendingUp className="h-4 w-4" />} label="Ticket médio" value={formatBRL(avgTicket)} accent />
        <Metric icon={<Clock className="h-4 w-4" />} label="Pix pendentes" value={String(pendingOrders.length)} />
      </div>

      <div className="mb-4 flex gap-1 border-b border-border/60">
        <TabBtn active={tab === "orders"} onClick={() => setTab("orders")}>Pedidos ({orders.length})</TabBtn>
        <TabBtn active={tab === "subs"} onClick={() => setTab("subs")}>Assinaturas ({subs.length})</TabBtn>
      </div>

      {tab === "orders" && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nº, cliente, arte, ID de pagamento…" className="pl-9" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
                <SelectItem value="refunded">Reembolsado</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
              </SelectContent>
            </Select>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos gateways</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-surface-2 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Nº</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Itens</th>
                  <th className="px-4 py-3 text-left">Total</th>
                  <th className="px-4 py-3 text-left">Gateway</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Nenhum pedido encontrado.</td></tr>
                )}
                {filteredOrders.map((o: any) => {
                  const itemsCount = Array.isArray(o.items) ? o.items.length : (o.artwork_id ? 1 : 0);
                  const title = itemsCount > 1 ? `${itemsCount} artes` : (o.artworks?.title ?? (Array.isArray(o.items) && o.items[0]?.title) ?? "—");
                  return (
                    <tr key={o.id} className="border-t border-border/40 hover:bg-surface-2/40">
                      <td className="px-4 py-3 font-mono text-xs">#{o.order_number}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{o.profile?.full_name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{o.profile?.email}</p>
                      </td>
                      <td className="px-4 py-3 max-w-[220px] truncate">{title}</td>
                      <td className="px-4 py-3">
                        {formatBRL(o.amount_cents)}
                        {o.discount_cents > 0 && <span className="ml-1 text-xs text-emerald-400">-{formatBRL(o.discount_cents)}</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs uppercase">{o.provider}</td>
                      <td className="px-4 py-3">
                        <Badge variant={o.status === "paid" ? "default" : o.status === "pending" ? "secondary" : "outline"}>
                          {STATUS_LABEL[o.status] ?? o.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(o.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link to="/admin/pedidos/$id" params={{ id: o.id }}>
                            <Eye className="mr-1 h-3 w-3" /> Ver
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "subs" && (
        <div className="overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface-2 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Plano</th>
                <th className="px-4 py-3 text-left">Créditos</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Renova em</th>
                <th className="px-4 py-3 text-left">Início</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s: any) => (
                <tr key={s.id} className="border-t border-border/40">
                  <td className="px-4 py-3">
                    <p className="font-medium">{s.profile?.full_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{s.profile?.email}</p>
                  </td>
                  <td className="px-4 py-3">{s.plans?.name} <span className="text-xs text-muted-foreground">({formatBRL(s.plans?.price_cents ?? 0)})</span></td>
                  <td className="px-4 py-3">{s.credits_remaining} / {s.plans?.monthly_credits ?? 0}</td>
                  <td className="px-4 py-3">
                    <Badge variant={s.status === "active" ? "default" : "outline"}>{s.status}</Badge>
                    {s.cancel_at_period_end && <span className="ml-2 text-xs text-amber-400">cancelamento agendado</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(s.current_period_end)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(s.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Metric({ icon, label, value, accent }: any) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-primary/40 bg-card shadow-brand" : "border-border/60 bg-card"}`}>
      <div className="mb-2 flex items-center gap-2 text-muted-foreground"><span className="text-primary">{icon}</span><span className="text-xs uppercase tracking-wide">{label}</span></div>
      <p className="font-display text-xl font-bold">{value}</p>
    </div>
  );
}

function TabBtn({ active, onClick, children }: any) {
  return (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-medium transition-colors ${active ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
      {children}
    </button>
  );
}
