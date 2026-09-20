import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatBRL } from "@/lib/format";
import { Palette, Users, ShoppingBag, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Overview,
});

function Overview() {
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [{ count: artworks }, { count: users }, { data: orders }, { count: support }, { data: subs }] = await Promise.all([
        supabase.from("artworks").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("amount_cents,status").eq("status", "paid"),
        supabase.from("support_messages").select("*", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("subscriptions").select("plans(price_cents)").eq("status", "active"),
      ]);
      const revenueOrders = (orders ?? []).reduce((a, b) => a + b.amount_cents, 0);
      const revenueSubs = (subs ?? []).reduce((a: number, b: any) => a + (b.plans?.price_cents ?? 0), 0);
      return { artworks: artworks ?? 0, users: users ?? 0, revenue: revenueOrders + revenueSubs, support: support ?? 0 };
    },
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Visão geral</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card icon={<Palette className="h-5 w-5" />} label="Artes cadastradas" value={String(data?.artworks ?? 0)} />
        <Card icon={<Users className="h-5 w-5" />} label="Usuários" value={String(data?.users ?? 0)} />
        <Card icon={<ShoppingBag className="h-5 w-5" />} label="Faturamento (mês)" value={formatBRL(data?.revenue ?? 0)} accent />
        <Card icon={<MessageCircle className="h-5 w-5" />} label="Mensagens novas" value={String(data?.support ?? 0)} />
      </div>
      <div className="mt-8 rounded-xl border border-border/60 bg-card p-6">
        <h2 className="font-display text-lg font-bold">Bem-vindo ao painel</h2>
        <p className="mt-1 text-sm text-muted-foreground">Use o menu lateral para gerenciar o catálogo, usuários, blog e mensagens.</p>
      </div>
    </div>
  );
}

function Card({ icon, label, value, accent }: any) {
  return (
    <div className={`rounded-xl border p-5 ${accent ? "border-primary/40 bg-card shadow-brand" : "border-border/60 bg-card"}`}>
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">{icon}<span className="text-xs uppercase">{label}</span></div>
      <p className="font-display text-2xl font-bold">{value}</p>
    </div>
  );
}
