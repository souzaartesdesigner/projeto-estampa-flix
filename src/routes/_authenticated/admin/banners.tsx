import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload as UploadIcon } from "lucide-react";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/banners")({ component: Banners });

const POSITIONS: Record<string, string> = {
  home_hero: "Home — hero",
  home_middle: "Home — meio",
  catalog_top: "Topo do catálogo",
};

function Banners() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);

  const { data: banners = [] } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => ((await (supabase as any).from("banners").select("*").order("position").order("sort_order")).data ?? []),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Banner removido"); qc.invalidateQueries({ queryKey: ["admin-banners"] }); },
  });

  const toggle = useMutation({
    mutationFn: async (b: any) => {
      const { error } = await (supabase as any).from("banners").update({ is_active: !b.is_active }).eq("id", b.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-banners"] }),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Banners</h1>
        <Button onClick={() => setEditing({})} className="bg-gradient-brand text-brand-foreground"><Plus className="mr-1 h-4 w-4" /> Novo banner</Button>
      </div>

      {banners.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
          Nenhum banner criado. Clique em "Novo banner" para adicionar carrosséis promocionais.
        </div>
      ) : (
        <div className="grid gap-3">
          {banners.map((b: any) => (
            <div key={b.id} className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-3 sm:flex-row sm:items-center">
              <img src={b.image_url} alt="" className="h-20 w-32 shrink-0 rounded-md object-cover bg-surface-2" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{b.title}</p>
                  <Badge variant="outline">{POSITIONS[b.position]}</Badge>
                  {!b.is_active && <Badge variant="secondary">Inativo</Badge>}
                </div>
                {b.subtitle && <p className="text-sm text-muted-foreground">{b.subtitle}</p>}
                <p className="text-xs text-muted-foreground">
                  Ordem {b.sort_order}
                  {b.starts_at && ` • De ${formatDate(b.starts_at)}`}
                  {b.ends_at && ` até ${formatDate(b.ends_at)}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={b.is_active} onCheckedChange={() => toggle.mutate(b)} />
                <Button size="sm" variant="outline" onClick={() => setEditing(b)}><Pencil className="h-3 w-3" /></Button>
                <Button size="sm" variant="ghost" onClick={() => confirm("Remover banner?") && remove.mutate(b.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <BannerDialog banner={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function BannerDialog({ banner, onClose }: { banner: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>({
    title: banner.title ?? "",
    subtitle: banner.subtitle ?? "",
    image_url: banner.image_url ?? "",
    link_url: banner.link_url ?? "",
    cta_label: banner.cta_label ?? "",
    position: banner.position ?? "home_hero",
    sort_order: banner.sort_order ?? 0,
    is_active: banner.is_active ?? true,
    starts_at: banner.starts_at ? banner.starts_at.slice(0, 16) : "",
    ends_at: banner.ends_at ? banner.ends_at.slice(0, 16) : "",
  });
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      const path = `banners/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("artwork-previews").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("artwork-previews").getPublicUrl(path);
      setForm((f: any) => ({ ...f, image_url: data.publicUrl }));
    } catch (e: any) { toast.error(e.message); } finally { setUploading(false); }
  }

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        sort_order: Number(form.sort_order) || 0,
      };
      if (!payload.title || !payload.image_url) throw new Error("Preencha título e imagem");
      const q: any = supabase.from("banners");
      const { error } = banner.id ? await q.update(payload).eq("id", banner.id) : await q.insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Banner salvo"); qc.invalidateQueries({ queryKey: ["admin-banners"] }); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{banner.id ? "Editar banner" : "Novo banner"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-xs uppercase text-muted-foreground">Imagem</Label>
            <div className="flex items-center gap-3">
              {form.image_url && <img src={form.image_url} alt="" className="h-20 w-32 rounded-md object-cover bg-surface-2" />}
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                <span className="inline-flex items-center gap-1 rounded-md border border-border/60 px-3 py-2 text-sm hover:bg-muted"><UploadIcon className="h-3 w-3" /> {uploading ? "Enviando…" : "Carregar imagem"}</span>
              </label>
            </div>
            <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="Ou cole uma URL de imagem" className="mt-2" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Subtítulo</Label><Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
            <div><Label>Link ao clicar</Label><Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="/planos" /></div>
            <div><Label>Texto do botão</Label><Input value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} placeholder="Ver mais" /></div>
            <div>
              <Label>Posição</Label>
              <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(POSITIONS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Ordem</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
            <div><Label>Inicia em</Label><Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></div>
            <div><Label>Termina em</Label><Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            <Label>Ativo</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-gradient-brand text-brand-foreground">Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
