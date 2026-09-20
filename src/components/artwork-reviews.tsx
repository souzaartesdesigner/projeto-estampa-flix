import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Trash2, BadgeCheck, Clock } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { formatDistanceToNow } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";

type Review = {
  id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  is_approved?: boolean;
  is_verified?: boolean;
  profiles?: { full_name: string | null; email: string | null } | null;
};

const COLORS = [
  "from-blue-500 to-cyan-500",
  "from-purple-500 to-pink-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-red-500",
  "from-indigo-500 to-blue-500",
  "from-fuchsia-500 to-purple-500",
];

function colorFor(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n + id.charCodeAt(i)) % COLORS.length;
  return COLORS[n];
}

const SELECT = "id,user_id,rating,comment,created_at,is_approved,is_verified,author_name";

export function ArtworkReviews({ artworkId }: { artworkId: string }) {
  const qc = useQueryClient();
  const { t, lang } = useI18n();
  const locale = lang === "pt" ? ptBR : lang === "es" ? es : enUS;

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => (await supabase.auth.getSession()).data.session,
  });
  const uid = session?.user.id;

  const { data: reviews = [], isLoading: isReviewsLoading } = useQuery({
    queryKey: ["reviews", artworkId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(SELECT)
        .eq("artwork_id", artworkId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const rows = (data ?? []) as any[];
      return rows.map((r) => ({
        ...r,
        profiles: { full_name: r.author_name || "Cliente", email: null },
      }));
    },

  });


  const { data: mine } = useQuery({
    queryKey: ["my-review", uid, artworkId],
    enabled: !!uid,
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select(SELECT)
        .eq("artwork_id", artworkId)
        .eq("user_id", uid!)
        .maybeSingle();
      return (data ?? null) as unknown as Review | null;
    },
  });

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  useEffect(() => {
    if (mine) {
      setRating(mine.rating);
      setComment(mine.comment ?? "");
    }
  }, [mine?.id]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["reviews", artworkId] });
    qc.invalidateQueries({ queryKey: ["my-review", uid, artworkId] });
  };

  const submit = useMutation({
    mutationFn: async () => {
      if (!uid) throw new Error("not_authenticated");
      const payload = { user_id: uid, artwork_id: artworkId, rating, comment: comment.trim() || null };
      const { error } = await supabase.from("reviews").upsert(payload, { onConflict: "user_id,artwork_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Avaliação enviada! Ela aparecerá após aprovação.");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro"),
  });

  const del = useMutation({
    mutationFn: async () => {
      if (!mine) return;
      const { error } = await supabase.from("reviews").delete().eq("id", mine.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setRating(5);
      setComment("");
      toast.success("Removida");
    },
  });

  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  const list = mine && !mine.is_approved ? [mine, ...reviews.filter((r) => r.id !== mine.id)] : reviews;

  return (
    <section className="mt-12 rounded-2xl border border-border/60 bg-card p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">{t("product.reviews")}</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`h-4 w-4 ${s <= Math.round(avg) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
              ))}
            </div>
            <span className="font-semibold">{avg.toFixed(1)}</span>
            <span className="text-muted-foreground">({reviews.length})</span>
          </div>
        )}
      </div>

      {/* Write review */}
      {uid ? (
        <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-xl">
          <p className="mb-3 text-sm font-medium">{t("product.reviewYours")}</p>
          <div className="mb-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                aria-label={`${s} estrelas`}
                className="transition-transform hover:scale-110"
              >
                <Star className={`h-7 w-7 ${s <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("product.reviewComment")}
            rows={3}
            className="mb-3"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => submit.mutate()} disabled={submit.isPending} className="bg-gradient-brand text-brand-foreground">
              {t("product.reviewSubmit")}
            </Button>
            {mine && (
              <Button variant="ghost" size="sm" onClick={() => del.mutate()}>
                <Trash2 className="mr-1 h-4 w-4" /> {t("product.reviewDelete")}
              </Button>
            )}
            <span className="text-xs text-muted-foreground">Todas as avaliações passam por aprovação.</span>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-sm text-muted-foreground backdrop-blur-xl">
          <Link to="/login" className="text-primary underline">
            Entre na sua conta
          </Link>{" "}
          para avaliar esta arte.
        </div>
      )}

      {isReviewsLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : list.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("product.reviewsEmpty")}</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {list.map((r) => {
            const name = r.profiles?.full_name || r.profiles?.email?.split("@")[0] || "Cliente";
            const pending = r.is_approved === false;
            return (
              <article
                key={r.id}
                className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-500 hover:border-primary/40 hover:bg-white/[0.04]"
              >
                <header className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-primary/20 bg-gradient-to-br ${colorFor(r.id)} text-lg font-bold text-white`}
                  >
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-black tracking-tight text-foreground">{name}</span>
                      {r.is_verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
                    </div>
                    <div className="mt-0.5 flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${s <= r.rating ? "fill-primary text-primary" : "text-muted-foreground/40"}`}
                        />
                      ))}
                    </div>
                  </div>
                  {pending ? (
                    <span className="flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning">
                      <Clock className="h-3 w-3" /> Em análise
                    </span>
                  ) : r.is_verified ? (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Verificado
                    </span>
                  ) : null}
                </header>
                {r.comment && <p className="mt-4 text-sm leading-relaxed text-foreground/70">"{r.comment}"</p>}
                <p className="mt-3 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale })}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
