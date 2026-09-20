import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { Search, Mail } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/emails")({ component: EmailsAdmin });

const STATUS_COLORS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  sent: "default",
  pending: "secondary",
  failed: "destructive",
  suppressed: "outline",
};

function EmailsAdmin() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const { data: logs = [] } = useQuery({
    queryKey: ["admin-emails", status],
    queryFn: async () => {
      let query: any = supabase.from("email_logs").select("*").order("created_at", { ascending: false }).limit(200);
      if (status !== "all") query = query.eq("status", status);
      return (await query).data ?? [];
    },
  });

  const filtered = logs.filter((l: any) => {
    if (!q) return true;
    const t = q.toLowerCase();
    return l.to_email?.toLowerCase().includes(t) || l.template?.toLowerCase().includes(t) || l.subject?.toLowerCase().includes(t);
  });

  const sentCount = logs.filter((l: any) => l.status === "sent").length;
  const failedCount = logs.filter((l: any) => l.status === "failed").length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">E-mails enviados</h1>
        <div className="flex gap-2 text-sm">
          <Badge variant="default">{sentCount} enviados</Badge>
          <Badge variant="destructive">{failedCount} falharam</Badge>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por destinatário, template, assunto…" className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="sent">Enviados</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="failed">Falharam</SelectItem>
            <SelectItem value="suppressed">Bloqueados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-surface-2 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Destinatário</th>
              <th className="px-4 py-3 text-left">Template</th>
              <th className="px-4 py-3 text-left">Assunto</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Data</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                <Mail className="mx-auto mb-2 h-8 w-8 opacity-50" />
                Nenhum e-mail registrado ainda.
                <p className="mt-1 text-xs">Configure o domínio de e-mail para começar a enviar mensagens transacionais.</p>
              </td></tr>
            )}
            {filtered.map((l: any) => (
              <tr key={l.id} className="border-t border-border/40 hover:bg-surface-2/40">
                <td className="px-4 py-3">{l.to_email}</td>
                <td className="px-4 py-3 font-mono text-xs">{l.template}</td>
                <td className="px-4 py-3 max-w-[280px] truncate">{l.subject ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_COLORS[l.status] ?? "outline"}>{l.status}</Badge>
                  {l.error && <p className="mt-1 text-[10px] text-destructive max-w-[200px] truncate" title={l.error}>{l.error}</p>}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(l.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
