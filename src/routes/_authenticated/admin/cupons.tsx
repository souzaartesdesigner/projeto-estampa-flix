import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2, Pencil, Plus } from "lucide-react";
import { formatBRL, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/cupons")({
  head: () => ({ meta: [{ title: "Cupons — Admin" }, { name: "robots", content: "noindex" }] }),
  component: CouponsAdmin,
});

type Coupon = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  scope: "subscription" | "pix" | "both";
  max_uses: number | null;
  uses_count: number;
  once_per_user: boolean;
  expires_at: string | null;
  active: boolean;
};

const EMPTY: Partial<Coupon> = {
  code: "",
  discount_type: "percent",
  discount_value: 10,
  scope: "pix",
  max_uses: null,
  once_per_user: true,
  active: true,
  expires_at: null,
};

function CouponsAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Coupon> | null>(null);

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      return (data ?? []) as Coupon[];
    },
  });

  const saveMut = useMutation({
    mutationFn: async (c: Partial<Coupon>) => {
      const payload = {
        code: (c.code ?? "").trim().toUpperCase(),
        discount_type: c.discount_type ?? "percent",
        discount_value: Number(c.discount_value ?? 0),
        scope: c.scope ?? "pix",
        max_uses: c.max_uses ? Number(c.max_uses) : null,
        once_per_user: !!c.once_per_user,
        active: c.active ?? true,
        expires_at: c.expires_at || null,
      };
      if (!payload.code) throw new Error("Código obrigatório");
      if (payload.discount_value <= 0) throw new Error("Valor inválido");
      if (c.id) {
        const { error } = await supabase.from("coupons").update(payload).eq("id", c.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("coupons").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      setEditing(null);
      toast.success("Cupom salvo");
    },
    onError: (e: any) => toast.error(e?.message || "Erro"),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Removido");
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Cupons</h1>
          <p className="text-sm text-muted-foreground">
            Cupons Pix são aplicados no carrinho. Para assinaturas, use os códigos promocionais do Stripe (o checkout já os aceita).
          </p>
        </div>
        <Button onClick={() => setEditing(EMPTY)}><Plus className="mr-1 h-4 w-4" /> Novo cupom</Button>
      </div>

      {editing && (
        <div className="mb-6 rounded-xl border border-border/60 bg-card p-5">
          <h2 className="mb-4 font-semibold">{editing.id ? "Editar cupom" : "Novo cupom"}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Código">
              <Input value={editing.code ?? ""} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} placeholder="EX: BEMVINDO10" />
            </Field>
            <Field label="Tipo">
              <Select value={editing.discount_type ?? "percent"} onValueChange={(v) => setEditing({ ...editing, discount_type: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentual (%)</SelectItem>
                  <SelectItem value="fixed">Valor fixo (centavos)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label={editing.discount_type === "percent" ? "Percentual (1-100)" : "Valor em centavos"}>
              <Input type="number" value={editing.discount_value ?? 0} onChange={(e) => setEditing({ ...editing, discount_value: Number(e.target.value) })} />
            </Field>
            <Field label="Escopo">
              <Select value={editing.scope ?? "pix"} onValueChange={(v) => setEditing({ ...editing, scope: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">Compras Pix</SelectItem>
                  <SelectItem value="subscription">Assinaturas</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Limite total de usos (vazio = ilimitado)">
              <Input type="number" value={editing.max_uses ?? ""} onChange={(e) => setEditing({ ...editing, max_uses: e.target.value ? Number(e.target.value) : null })} />
            </Field>
            <Field label="Expira em (opcional)">
              <Input type="datetime-local" value={editing.expires_at ? editing.expires_at.slice(0, 16) : ""} onChange={(e) => setEditing({ ...editing, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            </Field>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={editing.once_per_user ?? true} onCheckedChange={(v) => setEditing({ ...editing, once_per_user: v })} /> Uma vez por usuário
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={editing.active ?? true} onCheckedChange={(v) => setEditing({ ...editing, active: v })} /> Ativo
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => saveMut.mutate(editing)} disabled={saveMut.isPending}>Salvar</Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Código</th>
              <th className="px-4 py-3 text-left">Desconto</th>
              <th className="px-4 py-3 text-left">Escopo</th>
              <th className="px-4 py-3 text-left">Usos</th>
              <th className="px-4 py-3 text-left">Validade</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Carregando…</td></tr>}
            {!isLoading && coupons.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Nenhum cupom criado.</td></tr>}
            {coupons.map((c) => (
              <tr key={c.id} className="border-t border-border/40">
                <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                <td className="px-4 py-3">{c.discount_type === "percent" ? `${c.discount_value}%` : formatBRL(c.discount_value)}</td>
                <td className="px-4 py-3">{c.scope === "pix" ? "Pix" : c.scope === "subscription" ? "Assinaturas" : "Ambos"}</td>
                <td className="px-4 py-3">{c.uses_count}{c.max_uses ? `/${c.max_uses}` : ""}</td>
                <td className="px-4 py-3">{c.expires_at ? formatDate(c.expires_at) : "—"}</td>
                <td className="px-4 py-3"><Badge variant={c.active ? "default" : "secondary"}>{c.active ? "Ativo" : "Inativo"}</Badge></td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(c)} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => confirm(`Excluir cupom ${c.code}?`) && delMut.mutate(c.id)} aria-label="Excluir"><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
