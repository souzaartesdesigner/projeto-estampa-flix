import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { slugify } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/tags")({ component: TagsPage });

function TagsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const { data: items = [] } = useQuery({
    queryKey: ["admin-tags-list"],
    queryFn: async () => (await supabase.from("tags").select("*").order("name")).data ?? [],
  });
  const add = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("tags").insert({ name, slug: slugify(name) }); if (error) throw error; },
    onSuccess: () => { setName(""); qc.invalidateQueries({ queryKey: ["admin-tags-list"] }); toast.success("Tag criada"); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("tags").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-tags-list"] }),
  });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Tags</h1>
      <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) add.mutate(); }} className="mb-6 flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da tag" />
        <Button type="submit" className="bg-gradient-brand text-brand-foreground">Adicionar</Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {items.map((t: any) => (
          <div key={t.id} className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1 text-sm">
            {t.name}
            <button onClick={() => del.mutate(t.id)}><Trash2 className="h-3 w-3 text-destructive" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
