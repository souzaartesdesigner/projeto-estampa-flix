import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { trackAddToCart } from "@/lib/analytics";

export type CartItem = {
  id: string;
  artwork_id: string;
  artworks: {
    id: string;
    slug: string;
    title: string;
    preview_url: string;
    price_cents: number;
  } | null;
};

function useSessionUserId() {
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUid(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUid(s?.user.id ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);
  return uid;
}

export function useCart() {
  const qc = useQueryClient();
  const uid = useSessionUserId();

  const { data: items = [] } = useQuery({
    queryKey: ["cart", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data } = await supabase
        .from("cart_items")
        .select("id, artwork_id, artworks(id,slug,title,preview_url,price_cents)")
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as CartItem[];
    },
  });

  const addMut = useMutation({
    mutationFn: async (artwork: any) => {
      const artworkId = typeof artwork === "string" ? artwork : artwork.id;
      if (!uid) throw new Error("not_authenticated");
      const { error } = await supabase
        .from("cart_items")
        .insert({ user_id: uid, artwork_id: artworkId });
      if (error && !String(error.message).includes("duplicate")) throw error;
      return artwork;
    },
    onSuccess: (artwork) => {
      qc.invalidateQueries({ queryKey: ["cart", uid] });
      toast.success("Adicionado ao carrinho");
      if (typeof artwork !== "string") {
        trackAddToCart(artwork);
      }
    },
    onError: (e: any) => {
      if (e?.message === "not_authenticated") {
        toast.error("Faça login para adicionar ao carrinho.");
      } else toast.error(e?.message || "Erro ao adicionar");
    },
  });

  const removeMut = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart", uid] }),
  });

  const clearMut = useMutation({
    mutationFn: async () => {
      if (!uid) return;
      await supabase.from("cart_items").delete().eq("user_id", uid);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart", uid] }),
  });

  const total = items.reduce((s, i) => s + (i.artworks?.price_cents ?? 0), 0);
  const contains = (artworkId: string) => items.some((i) => i.artwork_id === artworkId);

  return {
    items,
    count: items.length,
    total,
    contains,
    isAuthenticated: !!uid,
    add: addMut.mutate,
    adding: addMut.isPending,
    remove: removeMut.mutate,
    clear: clearMut.mutate,
  };
}
