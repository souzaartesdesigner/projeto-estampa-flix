import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/planos")({ component: Planos });

type PlanRow = {
  id: string;
  tier: string;
  name: string;
  description: string | null;
  price_cents: number;
  monthly_credits: number;
  features: any;
  is_active: boolean;
  sort_order: number;
  stripe_price_id: string | null;
};

function Planos() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["admin-plans-list"],
    queryFn: async () => (await supabase.from("plans").select("*").order("sort_order")).data ?? [],
  });

  const save = useMutation({
    mutationFn: async (p: PlanRow) => {
      const { id, tier: _tier, ...rest } = p;
      const { error } = await supabase.from("plans").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-plans-list"] }); toast.success("Plano atualizado"); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("plans").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-plans-list"] }); toast.success("Plano removido"); },
    onError: (e: any) => toast.error(e.message),
  });

  const create = useMutation({
    mutationFn: async () => {
      const tier = prompt("Tier (identificador único, ex: premium_lite, pro, plus)");
      if (!tier) return;
      const name = prompt("Nome do plano") || tier;
      const { error } = await supabase.from("plans").insert({
        tier: tier as any, name, price_cents: 0, monthly_credits: 0, features: [], is_active: true, sort_order: (items.length ?? 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-plans-list"] }); toast.success("Plano criado"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Planos & Assinaturas</h1>
        <Button onClick={() => create.mutate()} className="bg-gradient-brand text-brand-foreground">
          <Plus className="mr-2 h-4 w-4" /> Novo plano
        </Button>
      </div>

      <div className="grid gap-4">
        {items.map((p: any) => (
          <PlanCard key={p.id} plan={p} onSave={(v) => save.mutate(v)} onDelete={() => del.mutate(p.id)} />
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground">Nenhum plano cadastrado.</p>}
      </div>
    </div>
  );
}

function PlanCard({ plan, onSave, onDelete }: { plan: PlanRow; onSave: (p: PlanRow) => void; onDelete: () => void }) {
  const [form, setForm] = useState<PlanRow>({ ...plan, features: Array.isArray(plan.features) ? plan.features : [] });
  const featuresText = Array.isArray(form.features) ? form.features.join("\n") : "";

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-muted-foreground">{form.tier}</p>
          <p className="font-display text-lg font-bold">{form.name} — {formatBRL(form.price_cents)}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /> Ativo
          </label>
          <Button size="icon" variant="ghost" onClick={onDelete}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Nome"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Ordem"><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} /></Field>
        <Field label="Preço (centavos)"><Input type="number" value={form.price_cents} onChange={(e) => setForm({ ...form, price_cents: Number(e.target.value) })} /></Field>
        <Field label="Créditos mensais"><Input type="number" value={form.monthly_credits} onChange={(e) => setForm({ ...form, monthly_credits: Number(e.target.value) })} /></Field>
        <Field label="Stripe price ID"><Input value={form.stripe_price_id ?? ""} onChange={(e) => setForm({ ...form, stripe_price_id: e.target.value || null })} /></Field>
        <Field label="Descrição"><Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <div className="md:col-span-2">
          <Field label="Recursos (um por linha)">
            <Textarea rows={4} value={featuresText} onChange={(e) => setForm({ ...form, features: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })} />
          </Field>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={() => onSave(form)} className="bg-gradient-brand text-brand-foreground">Salvar</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
