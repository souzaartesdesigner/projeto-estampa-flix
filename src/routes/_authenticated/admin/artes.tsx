import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { Plus, Trash2, Eye, EyeOff, Tag, DollarSign, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { brlToCents } from "@/lib/format";

import { ArtworkForm } from "@/features/admin/artes/artwork-form";
import { ArtworksTable } from "@/features/admin/artes/artworks-table";
import { VisualIndexPanel } from "@/features/admin/artes/visual-index-panel";

export const Route = createFileRoute("/_authenticated/admin/artes")({ component: Artes });

const ITEMS_PER_PAGE = 30;

function Artes() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  
  // States para paginação e busca server-side
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [bulkAction, setBulkAction] = useState<"" | "price" | "category" | "credit_cost">("");
  const [bulkValue, setBulkValue] = useState<string>("");
  const [bulkOpen, setBulkOpen] = useState(false);

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => (await supabase.from("categories").select("id,name,parent_id").order("name")).data ?? [],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-artworks-paginated", page, search, categoryFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("artworks")
        .select("id,slug,title,description,category_id,preview_url,file_format,colors,price_cents,license_type,is_published,is_featured,is_trending,download_count,view_count,created_at,updated_at,credit_cost,gallery_urls,translations,featured_order,seo_title,seo_description,seo_keyword,product_code,alt_text,noindex,tech_specs,usage_instructions,license_text, categories!artworks_category_id_fkey(name), artwork_categories(category_id)", { count: "exact" });

      if (search) {
        query = query.or(`title.ilike.%${search}%,product_code.ilike.%${search}%,slug.ilike.%${search}%`);
      }

      if (categoryFilter !== "all") {
        query = query.eq("category_id", categoryFilter);
      }

      if (statusFilter !== "all") {
        query = query.eq("is_published", statusFilter === "published");
      }

      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      if (error) throw error;
      return { artworks: data ?? [], total: count ?? 0 };
    },
  });

  const artworks = data?.artworks ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("artworks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-artworks-paginated"] }); toast.success("Arte excluída"); },
    onError: (e: any) => toast.error(e.message),
  });

  const bulkUpdate = useMutation({
    mutationFn: async (patch: Record<string, any>) => {
      const { error } = await (supabase.from("artworks") as any).update(patch).in("id", selected);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-artworks-paginated"] }); toast.success("Artes atualizadas"); setSelected([]); setBulkOpen(false); setBulkValue(""); setBulkAction(""); },
    onError: (e: any) => toast.error(e.message),
  });

  const bulkAddCategory = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await (supabase.from("artwork_categories") as any).upsert(
        selected.map((id) => ({ artwork_id: id, category_id: categoryId })),
        { onConflict: "artwork_id,category_id" }
      );
      if (error) throw error;
      await (supabase.from("artworks") as any).update({ category_id: categoryId }).in("id", selected).is("category_id", null);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-artworks-paginated"] }); toast.success("Categoria adicionada"); setSelected([]); setBulkOpen(false); setBulkValue(""); setBulkAction(""); },
    onError: (e: any) => toast.error(e.message),
  });

  const bulkDelete = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("artworks").delete().in("id", selected);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-artworks-paginated"] }); toast.success("Artes excluídas"); setSelected([]); },
    onError: (e: any) => toast.error(e.message),
  });

  function toggle(id: string) {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }
  function toggleAll() {
    setSelected((s) => s.length === artworks.length ? [] : artworks.map((a: any) => a.id));
  }

  function applyBulk() {
    if (bulkAction === "price") {
      const cents = brlToCents(bulkValue);
      if (cents < 0) return toast.error("Preço inválido");
      bulkUpdate.mutate({ price_cents: cents });
    } else if (bulkAction === "category") {
      if (!bulkValue) return toast.error("Selecione a categoria");
      bulkAddCategory.mutate(bulkValue);
    } else if (bulkAction === "credit_cost") {
      const c = parseInt(bulkValue, 10);
      if (!Number.isFinite(c) || c < 0) return toast.error("Valor inválido");
      bulkUpdate.mutate({ credit_cost: c });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Artes</h1>
          <p className="text-sm text-muted-foreground">Gerencie o seu catálogo de artes ({total} produtos)</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setEditing(null); setOpen(true); }} className="bg-gradient-brand text-brand-foreground">
            <Plus className="mr-2 h-4 w-4" /> Nova arte
          </Button>
        </div>
      </div>

      <VisualIndexPanel />

      <div className="grid gap-4 md:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            value={searchInput} 
            onChange={(e) => setSearchInput(e.target.value)} 
            placeholder="Buscar por título ou código do produto…" 
            className="pl-9" 
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="published">Publicado</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/40 bg-primary/5 p-3">
          <span className="text-sm font-medium">{selected.length} selecionadas</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => bulkUpdate.mutate({ is_published: true })}><Eye className="mr-1 h-3 w-3" /> Publicar</Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdate.mutate({ is_published: false })}><EyeOff className="mr-1 h-3 w-3" /> Despublicar</Button>
            <Button size="sm" variant="outline" onClick={() => { setBulkAction("price"); setBulkOpen(true); }}><DollarSign className="mr-1 h-3 w-3" /> Alterar preço</Button>
            <Button size="sm" variant="outline" onClick={() => { setBulkAction("category"); setBulkOpen(true); }}><Tag className="mr-1 h-3 w-3" /> Adicionar categoria</Button>
            <Button size="sm" variant="outline" onClick={() => { setBulkAction("credit_cost"); setBulkOpen(true); }}>Créditos</Button>
            <Button size="sm" variant="destructive" onClick={() => { if (confirm(`Excluir ${selected.length} artes?`)) bulkDelete.mutate(); }}><Trash2 className="mr-1 h-3 w-3" /> Excluir</Button>
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Limpar</Button>
          </div>
        </div>
      )}

      <div className="relative">
        {isLoading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">Carregando...</div>}
        <ArtworksTable
          artworks={artworks}
          onEdit={(a) => { setEditing(a); setOpen(true); }}
          onDelete={(id) => del.mutate(id)}
          selected={selected}
          onToggle={toggle}
          onToggleAll={toggleAll}
        />
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm">Página {page + 1} de {totalPages}</span>
          <Button variant="outline" size="icon" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}

      {open && (
        <ArtworkForm key={editing?.id ?? "new"} open={open} onOpenChange={setOpen} editing={editing} categories={categories} />
      )}

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === "price" && "Alterar preço em massa"}
              {bulkAction === "category" && "Adicionar categoria em massa"}
              {bulkAction === "credit_cost" && "Alterar custo em créditos"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{selected.length} artes serão atualizadas.</p>
            {bulkAction === "price" && (
              <Input type="number" step="0.01" min="0" value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} placeholder="Ex: 9.90" />
            )}
            {bulkAction === "credit_cost" && (
              <Input type="number" min="0" value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} placeholder="Ex: 1" />
            )}
            {bulkAction === "category" && (
              <Select value={bulkValue} onValueChange={setBulkValue}>
                <SelectTrigger><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancelar</Button>
            <Button onClick={applyBulk} disabled={bulkUpdate.isPending} className="bg-gradient-brand text-brand-foreground">Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}