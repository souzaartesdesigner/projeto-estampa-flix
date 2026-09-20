import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2, Pencil, ImageIcon, CornerDownRight } from "lucide-react";
import { slugify } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/categorias")({ component: Categorias });

function Categorias() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("none");
  const [editing, setEditing] = useState<any>(null);

  const { data: items = [] } = useQuery({
    queryKey: ["admin-categories-list"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order").order("name")).data ?? [],
  });

  const { parents, childrenByParent } = useMemo(() => {
    const parents = items.filter((c: any) => !c.parent_id);
    const childrenByParent: Record<string, any[]> = {};
    for (const c of items as any[]) {
      if (c.parent_id) {
        (childrenByParent[c.parent_id] ??= []).push(c);
      }
    }
    return { parents, childrenByParent };
  }, [items]);

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("categories").insert({
        name,
        slug: slugify(name),
        parent_id: parentId === "none" ? null : parentId,
      });
      if (error) throw error;
    },
    onSuccess: () => { setName(""); setParentId("none"); qc.invalidateQueries({ queryKey: ["admin-categories-list"] }); toast.success("Categoria criada"); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("categories").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-categories-list"] }),
  });
  const patch = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const { error } = await supabase.from("categories").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-categories-list"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const featuredCount = (items as any[]).filter((c) => c.featured).length;

  function renderRow(c: any, isChild = false) {
    return (
      <tr key={c.id} className="border-t border-border/40">
        <td className="px-4 py-3">
          {c.cover_url ? (
            <img src={c.cover_url} alt="" className="h-12 w-12 rounded object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded bg-surface-2 text-muted-foreground"><ImageIcon className="h-5 w-5" /></div>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {isChild && <CornerDownRight className="h-4 w-4 text-muted-foreground" />}
            <span className={isChild ? "text-muted-foreground" : "font-medium"}>{c.name}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
        <td className="px-4 py-3">
          <Switch
            checked={!!c.featured}
            onCheckedChange={(v) => patch.mutate({ id: c.id, values: { featured: v } })}
            aria-label="Destacar na home"
          />
        </td>
        <td className="px-4 py-3">
          <Input
            type="number"
            defaultValue={c.sort_order ?? 0}
            className="h-8 w-20"
            onBlur={(e) => {
              const v = Number(e.target.value) || 0;
              if (v !== (c.sort_order ?? 0)) patch.mutate({ id: c.id, values: { sort_order: v } });
            }}
          />
        </td>
        <td className="px-4 py-3 text-right">
          <Button size="icon" variant="ghost" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => { if (confirm("Excluir categoria?")) del.mutate(c.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </td>
      </tr>
    );
  }


  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-bold">Categorias</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Marque em <strong>Destaque</strong> as categorias que aparecem no carrossel da home e use <strong>Ordem</strong> para definir a sequência.
        {featuredCount === 0
          ? " Nenhuma em destaque — a home está mostrando todas as categorias."
          : ` ${featuredCount} categoria(s) em destaque.`}
      </p>
      <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) add.mutate(); }} className="mb-6 flex flex-wrap gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da categoria" className="min-w-[200px] flex-1" />
        <Select value={parentId} onValueChange={setParentId}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Categoria pai (opcional)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem pai (categoria raiz)</SelectItem>
            {parents.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" className="bg-gradient-brand text-brand-foreground">Adicionar</Button>
      </form>
      <div className="overflow-hidden rounded-xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3 text-left">Imagem</th><th className="px-4 py-3 text-left">Nome</th><th className="px-4 py-3 text-left">Slug</th><th className="px-4 py-3 text-left">Destaque</th><th className="px-4 py-3 text-left">Ordem</th><th></th></tr></thead>
          <tbody>
            {parents.flatMap((p: any) => [
              renderRow(p),
              ...(childrenByParent[p.id] ?? []).map((child: any) => renderRow(child, true)),
            ])}
          </tbody>
        </table>
      </div>
      {editing && <EditCategory key={editing.id} category={editing} allCategories={items} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EditCategory({ category, allCategories, onClose }: { category: any; allCategories: any[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: category.name ?? "",
    slug: category.slug ?? "",
    description: category.description ?? "",
    cover_url: category.cover_url ?? "",
    featured: category.featured ?? false,
    parent_id: category.parent_id ?? "none",
    seo_title: category.seo_title ?? "",
    seo_description: category.seo_description ?? "",
    seo_keyword: category.seo_keyword ?? "",
    
    cover_alt: category.cover_alt ?? "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  // não permitir se tornar pai/filho de si mesma nem de suas filhas
  const descendantIds = useMemo(() => {
    const ids = new Set<string>([category.id]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const c of allCategories) {
        if (c.parent_id && ids.has(c.parent_id) && !ids.has(c.id)) {
          ids.add(c.id);
          changed = true;
        }
      }
    }
    return ids;
  }, [allCategories, category.id]);

  const parentOptions = allCategories.filter((c: any) => !descendantIds.has(c.id));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      let cover_url = form.cover_url;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `categories/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("artwork-previews").upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        cover_url = supabase.storage.from("artwork-previews").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("categories").update({
        name: form.name,
        slug: form.slug || slugify(form.name),
        description: form.description || null,
        cover_url: cover_url || null,
        featured: form.featured,
        parent_id: form.parent_id === "none" ? null : form.parent_id,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        seo_keyword: form.seo_keyword || null,
        
        cover_alt: form.cover_alt || null,
      }).eq("id", category.id);
      if (error) throw error;
      toast.success("Categoria atualizada");
      qc.invalidateQueries({ queryKey: ["admin-categories-list"] });
      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar categoria</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="grid gap-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
          <div className="grid gap-2">
            <Label>Categoria pai</Label>
            <Select value={form.parent_id} onValueChange={(v) => setForm({ ...form, parent_id: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem pai (categoria raiz)</SelectItem>
                {parentOptions.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Selecione uma categoria pai para transformar esta em subcategoria.</p>
          </div>
          <div className="grid gap-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          <div className="grid gap-2">
            <Label>Imagem da categoria</Label>
            {form.cover_url && <img src={form.cover_url} alt="" className="h-32 w-full rounded object-cover" />}
            <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="ou cole uma URL https://..." />
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Metadados de SEO</h3>
            
            <div className="grid gap-2">
              <Label>Texto Alt da Imagem</Label>
              <Input 
                value={form.cover_alt} 
                onChange={(e) => setForm({ ...form, cover_alt: e.target.value })} 
                placeholder="Ex: Arte para sublimação de canecas de futebol"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label>Meta Title (Título SEO)</Label>
                <span className="text-[10px] text-muted-foreground">{form.seo_title.length} caracteres</span>
              </div>
              <Input 
                value={form.seo_title} 
                onChange={(e) => setForm({ ...form, seo_title: e.target.value })} 
                placeholder="Título para o Google"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label>Meta Description</Label>
                <span className={`text-[10px] ${form.seo_description.length > 160 ? "text-destructive" : "text-muted-foreground"}`}>
                  {form.seo_description.length}/160
                </span>
              </div>
              <Textarea 
                value={form.seo_description} 
                onChange={(e) => setForm({ ...form, seo_description: e.target.value })} 
                placeholder="Descrição resumida para o Google..."
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label>Frase-chave Foco</Label>
              <Input 
                value={form.seo_keyword} 
                onChange={(e) => setForm({ ...form, seo_keyword: e.target.value })} 
                placeholder="Ex: artes para canecas, sublimação futebol"
              />
            </div>

          </div>

          <Button type="submit" disabled={busy} className="w-full bg-gradient-brand text-brand-foreground">{busy ? "Salvando..." : "Salvar"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
