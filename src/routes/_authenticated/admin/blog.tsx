import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { slugify, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/blog")({ component: BlogAdmin });

function BlogAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: posts = [] } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => (await supabase.from("blog_posts").select("*").order("published_at", { ascending: false })).data ?? [],
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("blog_posts").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-posts"] }); toast.success("Post excluído"); },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Blog</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="bg-gradient-brand text-brand-foreground"><Plus className="mr-2 h-4 w-4" /> Novo post</Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3 text-left">Título</th><th className="px-4 py-3 text-left">Autor</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Data</th><th></th></tr></thead>
          <tbody>
            {posts.map((p: any) => (
              <tr key={p.id} className="border-t border-border/40">
                <td className="px-4 py-3">{p.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.author_name}</td>
                <td className="px-4 py-3">{p.is_published ? <Badge>Publicado</Badge> : <Badge variant="secondary">Rascunho</Badge>}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(p.published_at)}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Excluir?")) del.mutate(p.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PostForm open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}

function PostForm({ open, onOpenChange, editing }: any) {
  const qc = useQueryClient();
  const isEdit = !!editing;
  const [form, setForm] = useState<any>({
    title: editing?.title ?? "",
    slug: editing?.slug ?? "",
    excerpt: editing?.excerpt ?? "",
    cover_url: editing?.cover_url ?? "",
    content: editing?.content ?? "",
    author_name: editing?.author_name ?? "Equipe",
    is_published: editing?.is_published ?? true,
    seo_title: editing?.seo_title ?? "",
    seo_description: editing?.seo_description ?? "",
    seo_keyword: editing?.seo_keyword ?? "",
    cover_alt: editing?.cover_alt ?? "",
  });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const payload = { ...form, slug: form.slug || slugify(form.title) };
    const { error } = isEdit
      ? await supabase.from("blog_posts").update(payload).eq("id", editing.id)
      : await supabase.from("blog_posts").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-posts"] });
    toast.success(isEdit ? "Atualizado" : "Criado");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{isEdit ? "Editar post" : "Novo post"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-2"><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div className="grid gap-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
          <div className="grid gap-2"><Label>Resumo</Label><Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} /></div>
          <div className="grid gap-2"><Label>URL da capa</Label><Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} /></div>
          <div className="grid gap-2"><Label>Autor</Label><Input value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} /></div>
          <div className="grid gap-2"><Label>Conteúdo</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={10} required /></div>
          
          <div className="mt-6 space-y-4 rounded-lg border border-border/40 bg-muted/30 p-4">
            <h3 className="font-medium text-sm">Configurações de SEO</h3>
            <div className="grid gap-2">
              <Label>Meta Title</Label>
              <Input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} placeholder="Deixe vazio para usar o título do post" />
            </div>
            <div className="grid gap-2">
              <Label>Meta Description</Label>
              <Textarea value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} rows={2} placeholder="Deixe vazio para usar o resumo" />
            </div>
            <div className="grid gap-2">
              <Label>Frase-chave Foco</Label>
              <Input value={form.seo_keyword} onChange={(e) => setForm({ ...form, seo_keyword: e.target.value })} placeholder="ex: tutorial sublimação caneca" />
            </div>
            <div className="grid gap-2">
              <Label>Texto Alt da Imagem</Label>
              <Input value={form.cover_alt} onChange={(e) => setForm({ ...form, cover_alt: e.target.value })} placeholder="Descrição da imagem para acessibilidade e SEO" />
            </div>
          </div>

          <label className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} /> Publicado</label>
          <Button type="submit" disabled={busy} className="w-full bg-gradient-brand text-brand-foreground">{busy ? "Salvando..." : "Salvar"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
