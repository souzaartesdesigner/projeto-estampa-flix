import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import { Search, MessageCircle, CheckCircle2, Clock, Archive } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/suporte")({ component: SuporteAdmin });

const STATUS_TABS = [
  { key: "open", label: "Abertas", icon: MessageCircle, variant: "default" as const },
  { key: "in_progress", label: "Em andamento", icon: Clock, variant: "secondary" as const },
  { key: "resolved", label: "Resolvidas", icon: CheckCircle2, variant: "outline" as const },
  { key: "closed", label: "Fechadas", icon: Archive, variant: "outline" as const },
];

function SuporteAdmin() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<string>("open");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const { data: msgs = [] } = useQuery({
    queryKey: ["admin-support"],
    queryFn: async () => ((await (supabase as any).from("support_messages").select("*").order("created_at", { ascending: false })).data ?? []),
  });

  const counts = useMemo(() => {
    const c: Record<string, number> = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    msgs.forEach((m: any) => { c[m.status ?? "open"] = (c[m.status ?? "open"] ?? 0) + 1; });
    return c;
  }, [msgs]);

  const filtered = msgs.filter((m: any) => {
    if ((m.status ?? "open") !== tab) return false;
    if (!q) return true;
    const t = q.toLowerCase();
    return m.subject?.toLowerCase().includes(t) || m.name?.toLowerCase().includes(t) || m.email?.toLowerCase().includes(t) || m.message?.toLowerCase().includes(t);
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: any) => {
      const { error } = await (supabase as any).from("support_messages").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-support"] }); toast.success("Atualizado"); },
  });

  const sendReply = useMutation({
    mutationFn: async ({ id, replyText, close }: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      const patch: any = {
        admin_reply: replyText,
        replied_at: new Date().toISOString(),
        replied_by: user?.id,
        status: close ? "resolved" : "in_progress",
      };
      const { error } = await (supabase as any).from("support_messages").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-support"] }); toast.success("Resposta registrada"); setOpenId(null); setReply(""); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Suporte</h1>

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border/60">
        {STATUS_TABS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => setTab(s.key)}
              className={`flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${tab === s.key ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="h-4 w-4" /> {s.label} <span className="rounded-full bg-muted px-1.5 text-xs">{counts[s.key] ?? 0}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-4 relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por assunto, cliente ou conteúdo…" className="pl-9" />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
            Nenhuma mensagem nessa categoria.
          </div>
        )}
        {filtered.map((m: any) => {
          const isOpen = openId === m.id;
          return (
            <div key={m.id} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{m.subject}</h3>
                    <Badge variant={m.status === "open" ? "default" : "outline"}>{STATUS_TABS.find((s) => s.key === m.status)?.label ?? m.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">De {m.name} &lt;{m.email}&gt; em {formatDate(m.created_at)}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => { setOpenId(isOpen ? null : m.id); setReply(m.admin_reply ?? ""); }}>
                  {isOpen ? "Fechar" : "Abrir"}
                </Button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{m.message}</p>

              {m.admin_reply && !isOpen && (
                <div className="mt-3 rounded-md border-l-2 border-primary bg-surface-2 p-3">
                  <p className="text-xs uppercase text-muted-foreground">Sua resposta {m.replied_at && `• ${formatDate(m.replied_at)}`}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{m.admin_reply}</p>
                </div>
              )}

              {isOpen && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs uppercase text-muted-foreground">Sua resposta</label>
                    <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="Escreva a resposta para o cliente..." />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => sendReply.mutate({ id: m.id, replyText: reply, close: true })} disabled={sendReply.isPending || !reply.trim()} className="bg-gradient-brand text-brand-foreground">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Responder e resolver
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => sendReply.mutate({ id: m.id, replyText: reply, close: false })} disabled={sendReply.isPending || !reply.trim()}>
                      Salvar como em andamento
                    </Button>
                    <div className="ml-auto flex gap-2">
                      {m.status !== "in_progress" && <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: m.id, patch: { status: "in_progress" } })}>Marcar em andamento</Button>}
                      {m.status !== "resolved" && <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: m.id, patch: { status: "resolved" } })}>Resolver</Button>}
                      {m.status !== "closed" && <Button size="sm" variant="ghost" onClick={() => update.mutate({ id: m.id, patch: { status: "closed" } })}>Fechar</Button>}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">A resposta é salva no ticket. O envio automático por e-mail ativa quando o domínio de e-mail for configurado.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
