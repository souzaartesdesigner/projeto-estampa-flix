import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, Star, StarOff } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const Route = createFileRoute("/_authenticated/admin/home")({ component: HomeAdmin });

const TYPES: Record<string, string> = {
  featured: "Em destaque (marcadas manualmente)",
  popular: "Mais populares (por vendas)",
  new: "Novidades (mais recentes)",
  category: "Categoria específica",
  manual: "Curadoria manual",
};

function HomeAdmin() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Home do site</h1>
      <SectionsManager />
      <FeaturedManager />
    </div>
  );
}

function SectionsManager() {
  const qc = useQueryClient();
  const { data: sections = [] } = useQuery({
    queryKey: ["admin-home-sections"],
    queryFn: async () => ((await (supabase as any).from("home_sections").select("*, categories(name)").order("sort_order")).data ?? []),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-cats-select"],
    queryFn: async () => ((await supabase.from("categories").select("id,name").order("name")).data ?? []),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: any) => {
      const { error } = await (supabase as any).from("home_sections").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-home-sections"] }),
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("home_sections").insert({ title: "Nova seção", section_type: "featured", sort_order: sections.length + 1 });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Seção adicionada"); qc.invalidateQueries({ queryKey: ["admin-home-sections"] }); },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("home_sections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-home-sections"] }),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const oldIdx = sections.findIndex((s: any) => s.id === e.active.id);
    const newIdx = sections.findIndex((s: any) => s.id === e.over!.id);
    const ordered = arrayMove(sections, oldIdx, newIdx);
    qc.setQueryData(["admin-home-sections"], ordered);
    await Promise.all(ordered.map((s: any, i: number) => (supabase as any).from("home_sections").update({ sort_order: i + 1 }).eq("id", s.id)));
    qc.invalidateQueries({ queryKey: ["admin-home-sections"] });
  }

  return (
    <section className="rounded-xl border border-border/60 bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Seções exibidas na home</h2>
          <p className="text-xs text-muted-foreground">Arraste para reordenar. Desative para esconder do site.</p>
        </div>
        <Button size="sm" onClick={() => add.mutate()}><Plus className="mr-1 h-3 w-3" /> Adicionar seção</Button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={sections.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sections.map((s: any) => (
              <SortableSection key={s.id} s={s} categories={categories} onUpdate={(patch: any) => update.mutate({ id: s.id, patch })} onRemove={() => confirm("Remover seção?") && remove.mutate(s.id)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}

function SortableSection({ s, categories, onUpdate, onRemove }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
  const [showItems, setShowItems] = useState(false);
  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-border/60 bg-surface-2 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground"><GripVertical className="h-4 w-4" /></button>
        <div className="flex flex-col gap-1 sm:w-64">
          <Input value={s.title} onChange={(e) => onUpdate({ title: e.target.value })} placeholder="Título da seção" />
          <Input
            value={s.subtitle ?? ""}
            onChange={(e) => onUpdate({ subtitle: e.target.value })}
            placeholder="Subtítulo (opcional)"
            className="h-8 text-xs"
          />
        </div>
        <Select value={s.section_type} onValueChange={(v) => onUpdate({ section_type: v })}>
          <SelectTrigger className="sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
        </Select>
        {s.section_type === "category" && (
          <Select value={s.category_id ?? ""} onValueChange={(v) => onUpdate({ category_id: v })}>
            <SelectTrigger className="sm:w-48"><SelectValue placeholder="Escolher categoria" /></SelectTrigger>
            <SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        )}
        <div className="flex items-center gap-1">
          <Label className="text-xs text-muted-foreground">Limite</Label>
          <Input type="number" value={s.item_limit} onChange={(e) => onUpdate({ item_limit: Number(e.target.value) })} className="w-20" />
        </div>
        <div className="flex items-center gap-2">
          {s.section_type === "manual" && (
            <Button size="sm" variant="outline" onClick={() => setShowItems((v) => !v)}>
              {showItems ? "Fechar itens" : "Gerenciar itens"}
            </Button>
          )}
          <Switch checked={s.is_active} onCheckedChange={(v) => onUpdate({ is_active: v })} />
          <Button size="sm" variant="ghost" onClick={onRemove}><Trash2 className="h-3 w-3" /></Button>
        </div>
      </div>
      {s.section_type === "manual" && showItems && <ManualItemsPanel sectionId={s.id} />}
    </div>
  );
}

function ManualItemsPanel({ sectionId }: { sectionId: string }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const itemsKey = ["admin-section-items", sectionId];
  const { data: items = [] } = useQuery({
    queryKey: itemsKey,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("home_section_items")
        .select("id, sort_order, artwork:artworks(id,title,preview_url)")
        .eq("section_id", sectionId)
        .order("sort_order");
      return data ?? [];
    },
  });
  const { data: pool = [] } = useQuery({
    queryKey: ["admin-section-pool", sectionId, search],
    queryFn: async () => {
      let q: any = supabase.from("artworks").select("id,title,preview_url").eq("is_published", true).limit(20);
      if (search) q = q.ilike("title", `%${search}%`);
      return (await q).data ?? [];
    },
  });

  const add = useMutation({
    mutationFn: async (artworkId: string) => {
      const { error } = await (supabase as any).from("home_section_items").insert({
        section_id: sectionId, artwork_id: artworkId, sort_order: items.length + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: itemsKey }); toast.success("Item adicionado"); },
    onError: (e: any) => toast.error(e.message?.includes("duplicate") ? "Já adicionado" : "Erro ao adicionar"),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("home_section_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: itemsKey }),
  });

  const selectedIds = new Set(items.map((i: any) => i.artwork?.id));

  return (
    <div className="mt-3 border-t border-border/60 pt-3">
      <p className="mb-2 text-sm font-medium">Itens da seção ({items.length})</p>
      {items.length === 0 ? (
        <p className="mb-3 rounded-md border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">Nenhum item ainda. Escolha abaixo.</p>
      ) : (
        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          {items.map((it: any) => (
            <div key={it.id} className="flex items-center gap-2 rounded-md border border-border/60 bg-background p-2">
              <img src={it.artwork?.preview_url} alt="" className="h-10 w-10 rounded object-cover" />
              <span className="flex-1 truncate text-sm">{it.artwork?.title}</span>
              <Button size="sm" variant="ghost" onClick={() => remove.mutate(it.id)}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
        </div>
      )}
      <p className="mb-2 text-xs font-medium text-muted-foreground">Adicionar arte</p>
      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título…" className="mb-2 max-w-sm" />
      <div className="grid gap-2 sm:grid-cols-2">
        {pool.filter((a: any) => !selectedIds.has(a.id)).map((a: any) => (
          <button key={a.id} onClick={() => add.mutate(a.id)} className="flex items-center gap-3 rounded-md border border-border/60 bg-background p-2 text-left hover:border-primary transition-colors">
            <img src={a.preview_url} alt="" className="h-10 w-10 rounded object-cover" />
            <span className="flex-1 truncate text-sm">{a.title}</span>
            <Plus className="h-4 w-4 text-primary" />
          </button>
        ))}
      </div>
    </div>
  );
}

function FeaturedManager() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const { data: featured = [] } = useQuery({
    queryKey: ["admin-featured"],
    queryFn: async () => ((await (supabase as any).from("artworks").select("id,title,preview_url,slug,featured_order").eq("is_featured", true).order("featured_order")).data ?? []),
  });
  const { data: pool = [] } = useQuery({
    queryKey: ["admin-featured-pool", search],
    queryFn: async () => {
      let q: any = supabase.from("artworks").select("id,title,preview_url,slug,is_featured").eq("is_published", true).limit(20);
      if (search) q = q.ilike("title", `%${search}%`);
      return (await q).data ?? [];
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_featured }: any) => {
      const { error } = await (supabase as any).from("artworks").update({ is_featured, featured_order: is_featured ? (featured.length + 1) : 0 }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-featured"] }); qc.invalidateQueries({ queryKey: ["admin-featured-pool"] }); },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const oldIdx = featured.findIndex((a: any) => a.id === e.active.id);
    const newIdx = featured.findIndex((a: any) => a.id === e.over!.id);
    const ordered = arrayMove(featured, oldIdx, newIdx);
    qc.setQueryData(["admin-featured"], ordered);
    await Promise.all(ordered.map((a: any, i: number) => (supabase as any).from("artworks").update({ featured_order: i + 1 }).eq("id", a.id)));
    qc.invalidateQueries({ queryKey: ["admin-featured"] });
  }

  return (
    <section className="rounded-xl border border-border/60 bg-card p-5">
      <div className="mb-4">
        <h2 className="font-semibold">Artes em destaque</h2>
        <p className="text-xs text-muted-foreground">Arraste para reordenar. Clique na estrela para adicionar ou remover.</p>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-sm font-medium">Selecionadas ({featured.length})</p>
        {featured.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">Nenhuma arte em destaque ainda.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={featured.map((a: any) => a.id)} strategy={verticalListSortingStrategy}>
              <div className="grid gap-2 sm:grid-cols-2">
                {featured.map((a: any) => <SortableFeatured key={a.id} a={a} onRemove={() => toggle.mutate({ id: a.id, is_featured: false })} />)}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Adicionar destaque</p>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título…" className="mb-2 max-w-sm" />
        <div className="grid gap-2 sm:grid-cols-2">
          {pool.filter((a: any) => !a.is_featured).map((a: any) => (
            <button key={a.id} onClick={() => toggle.mutate({ id: a.id, is_featured: true })} className="flex items-center gap-3 rounded-md border border-border/60 bg-surface-2 p-2 text-left hover:border-primary transition-colors">
              <img src={a.preview_url} alt="" className="h-10 w-10 rounded object-cover bg-background" />
              <span className="flex-1 truncate text-sm">{a.title}</span>
              <Star className="h-4 w-4 text-primary" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function SortableFeatured({ a, onRemove }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: a.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 rounded-md border border-border/60 bg-surface-2 p-2">
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground"><GripVertical className="h-4 w-4" /></button>
      <img src={a.preview_url} alt="" className="h-10 w-10 rounded object-cover bg-background" />
      <span className="flex-1 truncate text-sm">{a.title}</span>
      <Badge variant="outline">#{a.featured_order}</Badge>
      <Button size="sm" variant="ghost" onClick={onRemove}><StarOff className="h-3 w-3" /></Button>
    </div>
  );
}
