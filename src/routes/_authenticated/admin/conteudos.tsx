import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { CONTENT_KEYS, useSiteContentMap, type ContentKeyDef } from "@/hooks/use-site-content";

export const Route = createFileRoute("/_authenticated/admin/conteudos")({ component: Conteudos });

type Draft = Record<string, { title: string; content: string }>;

function Conteudos() {
  const qc = useQueryClient();
  const { data: map, isLoading } = useSiteContentMap();
  const [draft, setDraft] = useState<Draft>({});

  useEffect(() => {
    if (!map) return;
    const next: Draft = {};
    for (const def of CONTENT_KEYS) {
      next[def.key] = {
        title: map[def.key]?.title ?? "",
        content: map[def.key]?.content ?? "",
      };
    }
    setDraft(next);
  }, [map]);

  const groups = useMemo(() => {
    const g: Record<string, ContentKeyDef[]> = {};
    for (const def of CONTENT_KEYS) (g[def.group] ??= []).push(def);
    return g;
  }, []);

  const save = useMutation({
    mutationFn: async () => {
      const rows = CONTENT_KEYS.map((def) => ({
        key: def.key,
        title: draft[def.key]?.title?.trim() || null,
        content: draft[def.key]?.content?.trim() || null,
      }));
      const { error } = await (supabase as any).from("site_content").upsert(rows, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conteúdos salvos");
      qc.invalidateQueries({ queryKey: ["site-content"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const upd = (key: string, field: "title" | "content") => (e: any) =>
    setDraft((d) => ({ ...d, [key]: { ...d[key], [field]: e.target.value } }));

  if (isLoading) return <p className="text-muted-foreground">Carregando…</p>;

  const groupNames = Object.keys(groups);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Conteúdos do site</h1>
          <p className="text-sm text-muted-foreground">Edite os textos do site sem mexer no código. Campos vazios usam o texto padrão.</p>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-gradient-brand text-brand-foreground">
          <Save className="mr-2 h-4 w-4" /> Salvar alterações
        </Button>
      </div>

      <Tabs defaultValue={groupNames[0]}>
        <TabsList className="mb-4 flex-wrap">
          {groupNames.map((g) => <TabsTrigger key={g} value={g}>{g}</TabsTrigger>)}
        </TabsList>

        {groupNames.map((g) => (
          <TabsContent key={g} value={g} className="space-y-4">
            {groups[g].map((def) => (
              <section key={def.key} className="rounded-xl border border-border/60 bg-card p-5">
                <h2 className="mb-1 font-semibold">{def.label}</h2>
                {def.hint && <p className="mb-3 text-xs text-muted-foreground">{def.hint}</p>}
                <div className="grid gap-4">
                  <div>
                    <Label className="mb-1.5 block text-xs uppercase text-muted-foreground">{def.titleLabel ?? "Título"}</Label>
                    <Input value={draft[def.key]?.title ?? ""} onChange={upd(def.key, "title")} />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs uppercase text-muted-foreground">{def.contentLabel ?? "Conteúdo"}</Label>
                    <Textarea
                      rows={def.rich ? 16 : 3}
                      className={def.rich ? "font-mono text-xs" : undefined}
                      value={draft[def.key]?.content ?? ""}
                      onChange={upd(def.key, "content")}
                      placeholder={def.rich ? "<h2>Título da seção</h2>\n<p>Texto…</p>" : undefined}
                    />
                    {def.rich && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Aceita HTML simples: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;a&gt;.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
