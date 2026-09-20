import { createFileRoute } from "@tanstack/react-router";
import { adminGrantOrderDownloads } from "@/lib/admin-artworks.functions";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";
import { Settings2, Plus, Trash2, Package, CreditCard, Search, UserPlus } from "lucide-react";
import { adminCreateUser, adminDeleteUser } from "@/lib/admin-users.functions";


export const Route = createFileRoute("/_authenticated/admin/usuarios")({ component: Users });

function Users() {
  const [selected, setSelected] = useState<any | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "subscribers" | "admins" | "free">("all");
  const [createOpen, setCreateOpen] = useState(false);


  const { data: rows = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: subs } = await supabase.from("subscriptions").select("id,user_id,plans(name,monthly_credits),status,credits_remaining,current_period_end");
      const { data: roles } = await supabase.from("user_roles").select("user_id,role");
      const { data: orders } = await supabase.from("orders").select("user_id,amount_cents,status");
      const byUser = new Map<string, any>();
      (profiles ?? []).forEach((p: any) => byUser.set(p.id, { ...p, subscription: null, roles: [], orders_count: 0, total_spent: 0 }));
      (subs ?? []).forEach((s: any) => { const u = byUser.get(s.user_id); if (u && s.status === "active") u.subscription = s; });
      (roles ?? []).forEach((r: any) => { const u = byUser.get(r.user_id); if (u) u.roles.push(r.role); });
      (orders ?? []).forEach((o: any) => { const u = byUser.get(o.user_id); if (u && o.status === "paid") { u.orders_count += 1; u.total_spent += o.amount_cents; } });
      return Array.from(byUser.values());
    },
  });

  const filtered = rows.filter((u: any) => {
    if (filter === "subscribers" && !u.subscription) return false;
    if (filter === "admins" && !u.roles.includes("admin")) return false;
    if (filter === "free" && u.subscription) return false;
    if (!q) return true;
    const term = q.toLowerCase();
    return u.full_name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term) || u.phone?.toLowerCase().includes(term);
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Usuários</h1>
        <Button onClick={() => setCreateOpen(true)} className="bg-gradient-brand text-brand-foreground">
          <UserPlus className="mr-2 h-4 w-4" /> Novo usuário
        </Button>
      </div>


      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, e-mail ou telefone…" className="pl-9" />
        </div>
        <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos ({rows.length})</SelectItem>
            <SelectItem value="subscribers">Assinantes ativos</SelectItem>
            <SelectItem value="admins">Administradores</SelectItem>
            <SelectItem value="free">Sem assinatura</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-surface-2 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Contato</th>
              <th className="px-4 py-3 text-left">Plano / Créditos</th>
              <th className="px-4 py-3 text-left">Pedidos</th>
              <th className="px-4 py-3 text-left">Total gasto</th>
              <th className="px-4 py-3 text-left">Papéis</th>
              <th className="px-4 py-3 text-left">Cadastro</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">Nenhum usuário encontrado.</td></tr>
            )}
            {filtered.map((u: any) => (
              <tr key={u.id} className="border-t border-border/40 hover:bg-surface-2/40">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.full_name ?? "—"}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{u.id.slice(0, 8)}…</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-muted-foreground">{u.email}</p>
                  {u.phone && <p className="text-xs text-muted-foreground">{u.phone}</p>}
                </td>
                <td className="px-4 py-3">
                  {u.subscription
                    ? <Badge>{u.subscription.plans?.name} • {u.subscription.credits_remaining}/{u.subscription.plans?.monthly_credits ?? 0} cr.</Badge>
                    : <span className="text-xs text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3">{u.orders_count}</td>
                <td className="px-4 py-3">{u.total_spent > 0 ? `R$ ${(u.total_spent / 100).toFixed(2)}` : "—"}</td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{u.roles.map((r: string) => <Badge key={r} variant={r === "admin" ? "default" : "secondary"}>{r}</Badge>)}</div></td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(u.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => setSelected(u)}>
                    <Settings2 className="mr-1 h-3 w-3" /> Gerenciar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {selected && (
        <ManageUserDialog user={selected} onClose={() => setSelected(null)} />
      )}

      {createOpen && (
        <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      )}
    </div>

  );
}

function ManageUserDialog({ user, onClose }: { user: any; onClose: () => void }) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  // Plans list
  const { data: plans = [] } = useQuery({
    queryKey: ["admin-plans-select"],
    queryFn: async () => (await supabase.from("plans").select("id,name,monthly_credits,price_cents").eq("is_active", true).order("sort_order")).data ?? [],
  });

  // Artworks list (for granting)
  const { data: artworks = [] } = useQuery({
    queryKey: ["admin-artworks-select"],
    queryFn: async () => (await supabase.from("artworks").select("id,title,slug,product_code").order("created_at", { ascending: false }).limit(50)).data ?? [],
  });

  // User's granted artworks (downloads + paid orders)
  const { data: granted = [] } = useQuery({
    queryKey: ["admin-user-granted", user.id],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("id,artwork_id,amount_cents,status,created_at,artworks(title,slug)").eq("user_id", user.id).eq("status", "paid").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const [planId, setPlanId] = useState<string>("");
  const [credits, setCredits] = useState<number>(0);
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [artworkId, setArtworkId] = useState<string>("");
  const [artSearch, setArtSearch] = useState("");

  const { data: searchResults = [] } = useQuery({
    queryKey: ["admin-artworks-search", artSearch],
    enabled: artSearch.length >= 2,
    queryFn: async () => {
      const { data } = await supabase
        .from("artworks")
        .select("id,title,product_code")
        .or(`title.ilike.%${artSearch}%,product_code.ilike.%${artSearch}%`)
        .limit(10);
      return data ?? [];
    },
  });

  const grantArtwork = useMutation({
    mutationFn: async () => {
      if (!artworkId) throw new Error("Selecione uma arte");
      
      // 1. Inserir o pedido manual
      const { data: order, error: orderErr } = await supabase.from("orders").insert({
        user_id: user.id,
        artwork_id: artworkId,
        amount_cents: 0,
        status: "paid",
        provider: "manual",
        paid_at: new Date().toISOString(),
      }).select("id").single();

      if (orderErr) throw orderErr;

      // 2. Chamar a RPC para garantir que vá para a tabela de downloads
      await adminGrantOrderDownloads({ data: { orderId: order.id } });
    },
    onSuccess: () => { 
      toast.success("Arte concedida e liberada para download"); 
      setArtworkId(""); 
      setArtSearch("");
      qc.invalidateQueries({ queryKey: ["admin-user-granted", user.id] }); 
      invalidate(); 
    },
    onError: (e: any) => toast.error(e.message),
  });

  const revokeArtwork = useMutation({
    mutationFn: async (order: { id: string; artwork_id: string }) => {
      const { error: e1 } = await supabase.from("orders").delete().eq("id", order.id);
      if (e1) throw e1;
      // Also remove any download record so the client loses access on the artwork page
      const { error: e2 } = await supabase.from("downloads").delete().eq("user_id", user.id).eq("artwork_id", order.artwork_id);
      if (e2) throw e2;
    },
    onSuccess: () => { toast.success("Concessão removida"); qc.invalidateQueries({ queryKey: ["admin-user-granted", user.id] }); qc.invalidateQueries({ queryKey: ["artwork-owned"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const addSubscription = useMutation({
    mutationFn: async () => {
      if (!planId) throw new Error("Selecione um plano");
      const plan = plans.find((p: any) => p.id === planId);
      const now = new Date();
      const end = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);
      // Cancel existing active subscription
      await supabase.from("subscriptions").update({ status: "canceled" as any }).eq("user_id", user.id).eq("status", "active");
      const { error } = await supabase.from("subscriptions").insert({
        user_id: user.id,
        plan_id: planId,
        status: "active",
        credits_remaining: credits || plan?.monthly_credits || 0,
        current_period_start: now.toISOString(),
        current_period_end: end.toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Assinatura adicionada"); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const removeSubscription = useMutation({
    mutationFn: async () => {
      if (!user.subscription) return;
      const { error } = await supabase.from("subscriptions").update({ status: "canceled" as any }).eq("id", user.subscription.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Assinatura removida"); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle>Gerenciar {user.full_name ?? user.email}</DialogTitle>
            <DialogDescription>{user.email}</DialogDescription>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            className="mr-8"
            onClick={async () => {
              if (confirm(`Excluir permanentemente o usuário ${user.email}? Esta ação não pode ser desfeita.`)) {
                try {
                  await adminDeleteUser({ data: { userId: user.id } });
                  toast.success("Usuário excluído");
                  invalidate();
                  onClose();
                } catch (err: any) {
                  toast.error(err.message || "Erro ao excluir");
                }
              }
            }}
          >
            <Trash2 className="mr-1 h-3 w-3" /> Excluir Conta
          </Button>
        </DialogHeader>


        {/* Subscription */}
        <section className="rounded-lg border border-border/60 p-4">
          <div className="mb-3 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Assinatura</h3>
          </div>
          {user.subscription ? (
            <div className="mb-3 flex items-center justify-between rounded-md bg-surface-2 p-3">
              <div className="text-sm">
                <p className="font-medium">{user.subscription.plans?.name}</p>
                <p className="text-muted-foreground">{user.subscription.credits_remaining} créditos • até {formatDate(user.subscription.current_period_end)}</p>
              </div>
              <Button size="sm" variant="destructive" onClick={() => removeSubscription.mutate()} disabled={removeSubscription.isPending}>
                <Trash2 className="mr-1 h-3 w-3" /> Cancelar
              </Button>
            </div>
          ) : (
            <p className="mb-3 text-sm text-muted-foreground">Sem assinatura ativa.</p>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Plano</Label>
              <Select value={planId} onValueChange={(v) => { setPlanId(v); const p = plans.find((x: any) => x.id === v); if (p) setCredits(p.monthly_credits); }}>
                <SelectTrigger><SelectValue placeholder="Escolher plano" /></SelectTrigger>
                <SelectContent>
                  {plans.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Créditos</Label>
              <Input type="number" value={credits} onChange={(e) => setCredits(Number(e.target.value))} />
            </div>
            <div>
              <Label>Duração (dias)</Label>
              <Input type="number" value={periodDays} onChange={(e) => setPeriodDays(Number(e.target.value))} />
            </div>
          </div>
          <Button className="mt-3 bg-gradient-brand text-brand-foreground" size="sm" onClick={() => addSubscription.mutate()} disabled={addSubscription.isPending || !planId}>
            <Plus className="mr-1 h-3 w-3" /> {user.subscription ? "Substituir assinatura" : "Adicionar assinatura"}
          </Button>
        </section>

        {/* Products */}
        <section className="rounded-lg border border-border/60 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Artes concedidas</h3>
          </div>
          <div className="mb-3 space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Pesquisar arte por título ou código..." 
                  value={artSearch}
                  onChange={(e) => setArtSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={artworkId} onValueChange={setArtworkId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={artSearch.length < 2 ? "Digite para pesquisar..." : "Selecione a arte nos resultados"} />
              </SelectTrigger>
              <SelectContent>
                {artSearch.length >= 2 ? (
                  searchResults.length > 0 ? (
                    searchResults.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.title} {a.product_code ? `(#${a.product_code})` : ""}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">Nenhuma arte encontrada</div>
                  )
                ) : (
                  artworks.slice(0, 20).map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Button 
              className="w-full bg-gradient-brand text-brand-foreground" 
              onClick={() => grantArtwork.mutate()} 
              disabled={grantArtwork.isPending || !artworkId}
            >
              <Plus className="mr-1 h-3 w-3" /> Conceder Acesso à Arte
            </Button>
          </div>
          {granted.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma arte concedida.</p>
          ) : (
            <ul className="divide-y divide-border/40 rounded-md border border-border/60">
              {granted.map((o: any) => (
                <li key={o.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div>
                    <p>{o.artworks?.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(o.created_at)} • {o.amount_cents === 0 ? "manual" : `R$ ${(o.amount_cents / 100).toFixed(2)}`}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => revokeArtwork.mutate({ id: o.id, artwork_id: o.artwork_id })}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}

function CreateUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ email: "", password: "", fullName: "", role: "user" as "user" | "admin" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await adminCreateUser({ data: form });
      toast.success("Usuário criado com sucesso");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar usuário");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Criar Novo Usuário</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-2"><Label>Nome Completo</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></div>
          <div className="grid gap-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
          <div className="grid gap-2"><Label>Senha Inicial</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} /></div>
          <div className="grid gap-2">
            <Label>Perfil</Label>
            <Select value={form.role} onValueChange={(v: any) => setForm({ ...form, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário Comum</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={busy} className="bg-gradient-brand text-brand-foreground">Criar Usuário</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

