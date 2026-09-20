import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import { Star, BadgeCheck, Check, X, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/avaliacoes")({ component: ReviewsAdmin });

const TABS = [
  { key: "pending", label: "Pendentes" },
  { key: "approved", label: "Aprovadas" },
];

function ReviewsAdmin() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("pending");

  const { data: rows = [] } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("reviews")
        .select("id,rating,comment,is_approved,is_verified,created_at,user_id,artwork_id,artworks(title,slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const reviews = data ?? [];
      const ids = [...new Set(reviews.map((r: any) => r.user_id).filter(Boolean))];
      let profileMap: Record<string, any> = {};
      if (ids.length) {
        const { data: profiles } = await (supabase as any)
          .from("profiles")
          .select("id,full_name,email")
          .in("id", ids);
        profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));
      }
      return reviews.map((r: any) => ({ ...r, profiles: profileMap[r.user_id] ?? null }));
    },
  });


  const filtered = rows.filter((r: any) => (tab === "pending" ? !r.is_approved : r.is_approved));

  const setApproved = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await (supabase as any).from("reviews").update({ is_approved: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Avaliação atualizada");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Avaliação removida");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Avaliações</h1>

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border/60">
        {TABS.map((s) => {
          const count = rows.filter((r: any) => (s.key === "pending" ? !r.is_approved : r.is_approved)).length;
          return (
            <button
              key={s.key}
              onClick={() => setTab(s.key)}
              className={`shrink-0 whitespace-nowrap border-b-2 px-4 py-2 text-sm transition-colors ${
                tab === s.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma avaliação nesta aba.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r: any) => (
            <div key={r.id} className="rounded-xl border border-border/60 bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">
                  {r.profiles?.full_name || r.profiles?.email?.split("@")[0] || "Cliente"}
                </span>
                {r.is_verified && (
                  <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    <BadgeCheck className="h-3 w-3" /> Verificado
                  </Badge>
                )}
                <span className="ml-auto text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
              </div>

              <div className="mt-1 flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`h-4 w-4 ${s <= r.rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                  ))}
                </div>
                <span className="truncate text-xs text-muted-foreground">{r.artworks?.title}</span>
              </div>

              {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}

              <div className="mt-3 flex gap-2">
                {r.is_approved ? (
                  <Button size="sm" variant="outline" onClick={() => setApproved.mutate({ id: r.id, value: false })}>
                    <X className="mr-1 h-4 w-4" /> Reprovar
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setApproved.mutate({ id: r.id, value: true })} className="bg-gradient-brand text-brand-foreground">
                    <Check className="mr-1 h-4 w-4" /> Aprovar
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => remove.mutate(r.id)}>
                  <Trash2 className="mr-1 h-4 w-4" /> Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
