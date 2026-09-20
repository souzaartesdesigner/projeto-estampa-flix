import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function useUid() {
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUid(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUid(s?.user.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);
  return uid;
}

export function useFavorites() {
  const qc = useQueryClient();
  const uid = useUid();

  const { data: ids = new Set<string>() } = useQuery({
    queryKey: ["favorites-ids", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("artwork_id");
      return new Set((data ?? []).map((r) => r.artwork_id));
    },
  });

  const toggle = useMutation({
    mutationFn: async (artworkId: string) => {
      if (!uid) throw new Error("not_authenticated");
      if (ids.has(artworkId)) {
        const { error } = await supabase.from("favorites").delete().eq("user_id", uid).eq("artwork_id", artworkId);
        if (error) throw error;
        return { removed: true };
      }
      const { error } = await supabase.from("favorites").insert({ user_id: uid, artwork_id: artworkId });
      if (error) throw error;
      return { removed: false };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["favorites-ids", uid] });
      qc.invalidateQueries({ queryKey: ["favorites", uid] });
      toast.success(res.removed ? "Removido dos favoritos" : "Salvo nos favoritos");
    },
    onError: (e: any) => {
      if (e?.message === "not_authenticated") toast.error("Faça login para salvar favoritos.");
      else toast.error(e?.message || "Erro");
    },
  });

  return {
    isAuthenticated: !!uid,
    isFavorite: (id: string) => ids.has(id),
    toggle: toggle.mutate,
    pending: toggle.isPending,
  };
}
