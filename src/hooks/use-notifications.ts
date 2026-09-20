import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  link: string | null;
  kind: string;
  is_read: boolean;
  created_at: string;
};

export function useNotifications() {
  const qc = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => (await supabase.auth.getSession()).data.session,
  });

  const uid = session?.user.id;

  const { data = [] } = useQuery({
    queryKey: ["notifications", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", uid!)
        .order("created_at", { ascending: false })
        .limit(30);
      return (data ?? []) as Notification[];
    },
  });

  useEffect(() => {
    if (!uid) return;
    const ch = supabase
      .channel(`notif-${uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` }, () => {
        qc.invalidateQueries({ queryKey: ["notifications", uid] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [uid, qc]);

  const markAll = useMutation({
    mutationFn: async () => {
      if (!uid) return;
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", uid).eq("is_read", false);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", uid] }),
  });

  const markOne = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", uid] }),
  });

  const unread = data.filter((n) => !n.is_read).length;

  return { list: data, unread, markAll: markAll.mutate, markOne: markOne.mutate, hasUser: !!uid };
}
