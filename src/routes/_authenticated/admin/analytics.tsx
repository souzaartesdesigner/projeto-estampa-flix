import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { DollarSign, TrendingUp, Users, Download, ShoppingCart, Star, TicketPercent, RefreshCw } from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/admin/analytics")({ component: Analytics });

const CHART_COLORS = ["hsl(210 100% 50%)", "hsl(280 80% 60%)", "hsl(160 70% 45%)", "hsl(30 90% 55%)", "hsl(340 80% 55%)", "hsl(50 90% 55%)"];

function Analytics() {
  const { data } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const now = new Date();
      const last30 = subDays(now, 30).toISOString();

      const [ordersRes, subsRes, plansRes, artworksRes, dlRes, usersRes, reviewsRes, couponsRes] = await Promise.all([
        supabase.from("orders").select("amount_cents,status,created_at,items,artwork_id,coupon_id").gte("created_at", last30),
        supabase.from("subscriptions").select("id,status,plan_id,created_at,plans(name,tier,price_cents)"),
        supabase.from("plans").select("id,name,price_cents"),
        supabase.from("artworks").select("id,title,download_count,category_id,categories!artworks_category_id_fkey(name)").order("download_count", { ascending: false }).limit(10),
        supabase.from("downloads").select("id,artwork_id,created_at,source").gte("created_at", last30),
        supabase.from("profiles").select("id,created_at").gte("created_at", last30),
        supabase.from("reviews").select("rating,created_at,artwork_id,artworks(title)").order("created_at", { ascending: false }).limit(50),
        supabase.from("coupons").select("id,code,uses_count,discount_type,discount_value,active"),
      ]);

      const orders = ordersRes.data ?? [];
      const paid = orders.filter((o: any) => o.status === "paid");
      const revenueOrders = paid.reduce((a: number, o: any) => a + o.amount_cents, 0);
      const activeSubs = (subsRes.data ?? []).filter((s: any) => s.status === "active");
      const mrr = activeSubs.reduce((a: number, s: any) => a + (s.plans?.price_cents ?? 0), 0);

      // Revenue per day (last 30d)
      const days: Record<string, { date: string; orders: number; count: number }> = {};
      for (let i = 29; i >= 0; i--) {
        const d = format(subDays(now, i), "dd/MM");
        days[format(subDays(now, i), "yyyy-MM-dd")] = { date: d, orders: 0, count: 0 };
      }
      paid.forEach((o: any) => {
        const k = format(startOfDay(new Date(o.created_at)), "yyyy-MM-dd");
        if (days[k]) {
          days[k].orders += o.amount_cents / 100;
          days[k].count += 1;
        }
      });
      const revenueSeries = Object.values(days);

      // Subs per plan
      const subsByPlan: Record<string, number> = {};
      activeSubs.forEach((s: any) => {
        const name = s.plans?.name ?? "—";
        subsByPlan[name] = (subsByPlan[name] ?? 0) + 1;
      });
      const subsPie = Object.entries(subsByPlan).map(([name, value]) => ({ name, value }));

      // Downloads per day
      const dlDays: Record<string, { date: string; count: number }> = {};
      for (let i = 29; i >= 0; i--) {
        const d = format(subDays(now, i), "dd/MM");
        dlDays[format(subDays(now, i), "yyyy-MM-dd")] = { date: d, count: 0 };
      }
      (dlRes.data ?? []).forEach((d: any) => {
        const k = format(startOfDay(new Date(d.created_at)), "yyyy-MM-dd");
        if (dlDays[k]) dlDays[k].count += 1;
      });
      const dlSeries = Object.values(dlDays);

      // Download sources
      const srcMap: Record<string, number> = {};
      (dlRes.data ?? []).forEach((d: any) => {
        srcMap[d.source] = (srcMap[d.source] ?? 0) + 1;
      });
      const dlSources = Object.entries(srcMap).map(([name, value]) => ({ name, value }));

      // Category performance
      const catMap: Record<string, number> = {};
      (artworksRes.data ?? []).forEach((a: any) => {
        const n = a.categories?.name ?? "Sem categoria";
        catMap[n] = (catMap[n] ?? 0) + (a.download_count ?? 0);
      });
      const catBars = Object.entries(catMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);

      // Reviews summary
      const reviews = reviewsRes.data ?? [];
      const avgRating = reviews.length ? reviews.reduce((a: number, r: any) => a + r.rating, 0) / reviews.length : 0;

      // Coupons usage
      const coupons = (couponsRes.data ?? []).sort((a: any, b: any) => (b.uses_count ?? 0) - (a.uses_count ?? 0)).slice(0, 10);

      // Conversion
      const newUsers = (usersRes.data ?? []).length;
      const buyers = new Set(paid.map((o: any) => o.user_id)).size;
      const conversion = newUsers > 0 ? (buyers / newUsers) * 100 : 0;

      return {
        revenueOrders,
        mrr,
        totalRevenue: revenueOrders + mrr,
        activeSubs: activeSubs.length,
        ordersCount: paid.length,
        newUsers,
        conversion,
        avgRating,
        reviewsCount: reviews.length,
        revenueSeries,
        subsPie,
        dlSeries,
        dlSources,
        catBars,
        topArtworks: artworksRes.data ?? [],
        coupons,
      };
    },
    refetchInterval: 60000,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Analytics</h1>
        <span className="flex items-center gap-1 text-xs text-muted-foreground"><RefreshCw className="h-3 w-3" /> Últimos 30 dias · atualiza a cada 60s</span>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<DollarSign className="h-4 w-4" />} label="Faturamento total" value={formatBRL(data?.totalRevenue ?? 0)} accent />
        <Kpi icon={<TrendingUp className="h-4 w-4" />} label="MRR (assinaturas ativas)" value={formatBRL(data?.mrr ?? 0)} />
        <Kpi icon={<ShoppingCart className="h-4 w-4" />} label="Vendas avulsas (30d)" value={String(data?.ordersCount ?? 0)} sub={formatBRL(data?.revenueOrders ?? 0)} />
        <Kpi icon={<Users className="h-4 w-4" />} label="Assinantes ativos" value={String(data?.activeSubs ?? 0)} />
        <Kpi icon={<Users className="h-4 w-4" />} label="Novos usuários (30d)" value={String(data?.newUsers ?? 0)} />
        <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Taxa de conversão" value={`${(data?.conversion ?? 0).toFixed(1)}%`} />
        <Kpi icon={<Star className="h-4 w-4" />} label="Nota média das artes" value={data?.avgRating ? data.avgRating.toFixed(2) : "—"} sub={`${data?.reviewsCount ?? 0} avaliações`} />
        <Kpi icon={<Download className="h-4 w-4" />} label="Downloads (30d)" value={String(data?.dlSeries?.reduce((a, d) => a + d.count, 0) ?? 0)} />
      </div>

      {/* Revenue chart */}
      <ChartCard title="Faturamento avulso — últimos 30 dias">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data?.revenueSeries ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" />
            <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} formatter={(v: any) => [`R$ ${Number(v).toFixed(2)}`, "Receita"]} />
            <Line type="monotone" dataKey="orders" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Assinaturas ativas por plano">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data?.subsPie ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {(data?.subsPie ?? []).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Downloads por dia (30d)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.dlSeries ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="count" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Origem dos downloads">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data?.dlSources ?? []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {(data?.dlSources ?? []).map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top categorias por downloads">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.catBars ?? []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="name" type="category" width={110} fontSize={11} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="count" fill={CHART_COLORS[2]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <h2 className="mb-3 font-display text-lg font-bold">Top 10 artes mais baixadas</h2>
          <div className="space-y-2">
            {(data?.topArtworks ?? []).map((a: any, i: number) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50">
                <span className="flex items-center gap-3 text-sm">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/20 text-xs font-bold text-primary">{i + 1}</span>
                  {a.title}
                </span>
                <span className="text-sm font-semibold">{a.download_count ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold"><TicketPercent className="h-4 w-4" /> Cupons mais usados</h2>
          <div className="space-y-2">
            {(data?.coupons ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhum cupom criado.</p>}
            {(data?.coupons ?? []).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50">
                <span className="flex items-center gap-2 text-sm font-mono uppercase">{c.code}
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-normal">
                    {c.discount_type === "percent" ? `${c.discount_value}%` : formatBRL(c.discount_value)}
                  </span>
                </span>
                <span className="text-sm font-semibold">{c.uses_count ?? 0} usos</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, sub, accent }: any) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-primary/40 bg-card shadow-brand" : "border-border/60 bg-card"}`}>
      <div className="mb-1 flex items-center gap-2 text-muted-foreground">{icon}<span className="text-xs uppercase">{label}</span></div>
      <p className="font-display text-xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <h2 className="mb-4 font-display text-lg font-bold">{title}</h2>
      {children}
    </div>
  );
}
