import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { adminGetArtworkExternalUrl, adminGetArtworkFilePath } from "@/lib/admin-artworks.functions";
import { supabase } from "@/integrations/supabase/client";
import { slugify, brlToCents, centsToBRLInput } from "@/lib/format";
import { FORMAT_SUGGESTIONS, normalizeFormat } from "@/features/catalog/catalog-constants";



type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: any;
  categories: any[];
};

async function uploadFile(file: File, bucket: string, folder: string) {
  const ext = file.name.split(".").pop();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  if (bucket === "artwork-previews") {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
  return path;
}

export function ArtworkForm({ open, onOpenChange, editing, categories }: Props) {
  const qc = useQueryClient();
  const router = useRouter();
  const isEdit = !!editing;
  const [form, setForm] = useState<any>({
    title: editing?.title ?? "",
    product_code: editing?.product_code ?? "",
    description: editing?.description ?? "",
    slug: editing?.slug ?? "",
    category_id: editing?.category_id ?? "",
    preview_url: editing?.preview_url ?? "",
    external_url: "",
    file_format: editing?.file_format ?? "png",
    price_brl: centsToBRLInput(editing?.price_cents ?? 990),
    credit_cost: editing?.credit_cost ?? 1,
    license_type: editing?.license_type ?? "premium",
    is_published: editing?.is_published ?? true,
    is_featured: editing?.is_featured ?? false,
    is_trending: editing?.is_trending ?? false,
    colors: (editing?.colors ?? []).join(","),
    gallery_urls: (editing?.gallery_urls ?? []) as string[],
    seo_title: editing?.seo_title ?? "",
    seo_description: editing?.seo_description ?? "",
    seo_keyword: editing?.seo_keyword ?? "",
    alt_text: editing?.alt_text ?? "",
    noindex: editing?.noindex ?? false,
    tech_specs: editing?.tech_specs ?? "",

    usage_instructions: editing?.usage_instructions ?? "",
    license_text: editing?.license_text ?? "",
    translations: (editing?.translations ?? {}) as Record<string, { title?: string; description?: string }>,
  });
  const [categoryIds, setCategoryIds] = useState<string[]>(() => {
    const linked: string[] = (editing?.artwork_categories ?? []).map((r: any) => r.category_id).filter(Boolean);
    const all = new Set<string>(linked);
    if (editing?.category_id) all.add(editing.category_id);
    return Array.from(all);
  });
  const [sourceType, setSourceType] = useState<"upload" | "external">("upload");

  // Nem o link externo nem o caminho do arquivo são legíveis na tabela pública;
  // só admins podem obtê-los via RPC protegida.
  useEffect(() => {
    if (!isEdit || !editing?.id) return;
    let cancelled = false;
    (async () => {
      const [ext, file] = await Promise.all([
        adminGetArtworkExternalUrl({ data: { artworkId: editing.id } }).catch(() => null),
        adminGetArtworkFilePath({ data: { artworkId: editing.id } }).catch(() => null),
      ]);
      if (cancelled) return;
      setForm((f: any) => ({
        ...f,
        external_url: ext?.url ?? f.external_url,
        file_path: file?.path ?? f.file_path,
      }));
      setSourceType(ext?.url ? "external" : "upload");
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, editing?.id]);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [artFile, setArtFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);


  const { data: knownFormats = [] } = useQuery({
    queryKey: ["admin-artwork-formats"],
    queryFn: async () => {
      const { data } = await supabase.from("artworks").select("file_format").not("file_format", "is", null);
      const set = new Set<string>(FORMAT_SUGGESTIONS);
      for (const r of data ?? []) {
        const f = normalizeFormat(r.file_format || "");
        if (f) set.add(f);
      }
      return Array.from(set).sort();
    },
  });


  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      let preview_url = form.preview_url;
      let file_path = form.file_path;
      let external_url: string | null = form.external_url?.trim() || null;

      if (previewFile) preview_url = await uploadFile(previewFile, "artwork-previews", "arts");
      if (!preview_url) throw new Error("Adicione uma imagem de preview (URL ou upload).");

      const gallery_urls = [...(form.gallery_urls ?? [])];
      for (const gf of galleryFiles) {
        const url = await uploadFile(gf, "artwork-previews", "gallery");
        gallery_urls.push(url);
      }

      if (sourceType === "external") {
        if (!external_url) throw new Error("Informe o link do Google Drive (ou externo).");
        file_path = null as any;
      } else {
        external_url = null;
        if (artFile) file_path = await uploadFile(artFile, "artwork-files", "arts");
        if (!file_path) throw new Error("Envie o arquivo para download.");
      }

      const baseSlug = slugify(form.title);
      let slug = form.slug?.trim();
      
      // Se for uma nova arte e o slug estiver vazio, garantimos um slug único incremental
      if (!isEdit && !slug) {
        let i = 1;
        let finalSlug = baseSlug;
        while (true) {
          const { data: exists } = await supabase.from("artworks").select("id").eq("slug", finalSlug).maybeSingle();
          if (!exists) {
            slug = finalSlug;
            break;
          }
          i++;
          finalSlug = `${baseSlug}-${i}`;
        }
      } else if (!slug) {
        slug = baseSlug;
      }

      const payload = {
        title: form.title,
        product_code: form.product_code?.trim() || (isEdit ? null : `EF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`),
        description: form.description,
        slug,
        category_id: categoryIds[0] || null,
        preview_url,
        file_path,
        external_url,
        file_format: normalizeFormat(form.file_format) || null,
        price_cents: brlToCents(form.price_brl),

        credit_cost: Number(form.credit_cost),
        license_type: form.license_type === "free" ? "free" : "premium",
        is_published: form.is_published,
        is_featured: form.is_featured,
        is_trending: form.is_trending,
        colors: [],
        gallery_urls,
        seo_title: form.seo_title?.trim() || null,
        seo_description: form.seo_description?.trim() || null,
        seo_keyword: form.seo_keyword?.trim() || null,
        alt_text: form.alt_text?.trim() || null,
        noindex: !!form.noindex,
        tech_specs: form.tech_specs?.trim() || null,
        resolution: null,
        dimensions: null,
        usage_instructions: form.usage_instructions?.trim() || null,
        license_text: form.license_text?.trim() || null,

        translations: form.translations,
      };

      let artworkId = editing?.id as string | undefined;
      if (isEdit) {
        const { data: upd, error } = await supabase
          .from("artworks")
          .update(payload)
          .eq("id", editing.id)
          .select("id, seo_title, seo_description, seo_keyword")
          .maybeSingle();
        if (error) throw error;
        if (!upd) throw new Error("Não foi possível salvar (sem permissão de administrador).");
      } else {
        const { data: ins, error } = await supabase.from("artworks").insert(payload).select("id").single();
        if (error) throw error;
        artworkId = ins.id;
      }

      if (artworkId) {
        await supabase.from("artwork_categories").delete().eq("artwork_id", artworkId);
        if (categoryIds.length) {
          const { error: linkErr } = await supabase
            .from("artwork_categories")
            .insert(categoryIds.map((cid) => ({ artwork_id: artworkId!, category_id: cid })));
          if (linkErr) throw linkErr;
        }
      }

      toast.success(isEdit ? "Arte atualizada (SEO salvo)" : "Arte criada");
      await qc.invalidateQueries({ queryKey: ["admin-artworks"] });
      qc.invalidateQueries();
      router.invalidate();
      onOpenChange(false);


    } catch (err: any) {
      toast.error(err.message ?? "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{isEdit ? "Editar arte" : "Nova arte"}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-2"><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div className="grid gap-2"><Label>Código do Produto (SKU)</Label><Input value={form.product_code} onChange={(e) => setForm({ ...form, product_code: e.target.value })} placeholder="Ex: SKU-123" /></div>
          <div className="grid gap-2"><Label>Slug (URL)</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="deixe vazio para gerar automaticamente" /></div>
          <div className="grid gap-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>

          <div className="grid gap-3 rounded-lg border border-primary/40 bg-primary/5 p-4">
            <Label className="text-primary">SEO (Google)</Label>
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Título SEO</Label>
              <Input
                value={form.seo_title}
                onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                placeholder="Ex.: Arte Vetor Camisa Terceirão Pantera"
                maxLength={70}
              />
              <span className="text-[11px] text-muted-foreground">{(form.seo_title ?? "").length}/60 caracteres recomendados</span>
            </div>
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Frase-chave foco</Label>
              <Input
                value={form.seo_keyword}
                onChange={(e) => setForm({ ...form, seo_keyword: e.target.value })}
                placeholder="Ex.: arte para sublimação futebol"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Meta descrição</Label>
              <Textarea
                rows={2}
                value={form.seo_description}
                onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                placeholder="Resumo que aparece no Google (até 160 caracteres)"
                maxLength={180}
              />
              <span className="text-[11px] text-muted-foreground">{(form.seo_description ?? "").length}/160 caracteres recomendados</span>
            </div>
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Texto alternativo das imagens (alt)</Label>
              <Input
                value={form.alt_text}
                onChange={(e) => setForm({ ...form, alt_text: e.target.value })}
                placeholder="Descreva a imagem para leitores de tela e para o Google"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={!!form.noindex} onCheckedChange={(v) => setForm({ ...form, noindex: v })} />
              Não indexar esta arte no Google (noindex)
            </label>
            <p className="text-xs text-muted-foreground">Preenchido automaticamente na importação do CSV. Se ficar vazio, o site gera a partir do título e da descrição.</p>
          </div>

          <div className="grid gap-3 rounded-lg border border-border/60 p-4">
            <Label>Detalhes da arte</Label>
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Especificações técnicas</Label>
              <Textarea rows={2} value={form.tech_specs} onChange={(e) => setForm({ ...form, tech_specs: e.target.value })} placeholder="Ex.: Arquivo vetorial editável, camadas separadas, fontes convertidas" />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Instruções de uso da estampa</Label>
              <Textarea rows={3} value={form.usage_instructions} onChange={(e) => setForm({ ...form, usage_instructions: e.target.value })} placeholder="Ex.: Indicada para sublimação em poliéster e DTF em algodão." />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Licença aplicável (opcional)</Label>
              <Textarea rows={2} value={form.license_text} onChange={(e) => setForm({ ...form, license_text: e.target.value })} placeholder="Deixe vazio para usar a licença comercial padrão do site." />
            </div>
          </div>



          <div className="grid gap-2 rounded-lg border border-border/60 p-4">
            <Label>Categorias (múltiplas)</Label>
            <p className="text-xs text-muted-foreground">A primeira selecionada é a categoria principal. Marque quantas quiser.</p>
            <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
              {categories.map((c: any) => {
                const checked = categoryIds.includes(c.id);
                return (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-muted/40">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={checked}
                      onChange={() =>
                        setCategoryIds((prev) =>
                          prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]
                        )
                      }
                    />
                    <span>{c.parent_id ? `— ${c.name}` : c.name}</span>
                    {checked && categoryIds[0] === c.id && (
                      <span className="ml-auto text-xs text-primary">principal</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">

            <div className="grid gap-2">
              <Label>Formato</Label>
              <Input
                list="artwork-format-options"
                value={form.file_format}
                onChange={(e) => setForm({ ...form, file_format: e.target.value })}
                placeholder="cdr, psd, ai, png..."
              />
              <datalist id="artwork-format-options">
                {knownFormats.map((f: string) => <option key={f} value={f} />)}
              </datalist>
              <p className="text-xs text-muted-foreground">Digite qualquer formato ou escolha um já usado.</p>
            </div>

          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2"><Label>Preço (R$)</Label><Input value={form.price_brl} onChange={(e) => setForm({ ...form, price_brl: e.target.value })} placeholder="Ex: 15,00" required /></div>
            <div className="grid gap-2"><Label>Custo em créditos</Label><Input type="number" min={0} value={form.credit_cost} onChange={(e) => setForm({ ...form, credit_cost: e.target.value })} required /></div>

          </div>
          <div className="grid gap-2">
            <Label>Imagem de preview (upload ou URL)</Label>
            <Input type="file" accept="image/*" onChange={(e) => setPreviewFile(e.target.files?.[0] ?? null)} />
            <Input value={form.preview_url} onChange={(e) => setForm({ ...form, preview_url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="grid gap-3 rounded-lg border border-border/60 p-4">
            <Label>Fonte do arquivo</Label>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={sourceType === "upload" ? "default" : "outline"} onClick={() => setSourceType("upload")}>Upload no site</Button>
              <Button type="button" size="sm" variant={sourceType === "external" ? "default" : "outline"} onClick={() => setSourceType("external")}>Link Google Drive / Externo</Button>
            </div>
            {sourceType === "upload" ? (
              <div className="grid gap-2">
                <Label className="text-xs text-muted-foreground">Arquivo para download (privado, baixado automaticamente)</Label>
                <Input type="file" onChange={(e) => setArtFile(e.target.files?.[0] ?? null)} />
                {form.file_path && <p className="text-xs text-muted-foreground">Atual: {form.file_path}</p>}
              </div>
            ) : (
              <div className="grid gap-2">
                <Label className="text-xs text-muted-foreground">Link do Google Drive (o cliente será redirecionado ao clicar em Fazer Download)</Label>
                <Input
                  value={form.external_url}
                  onChange={(e) => setForm({ ...form, external_url: e.target.value })}
                  placeholder="https://drive.google.com/..."
                />
              </div>
            )}
          </div>
          <div className="grid gap-2 rounded-lg border border-border/60 p-4">
            <Label>Galeria (imagens secundárias)</Label>
            <Input type="file" accept="image/*" multiple onChange={(e) => setGalleryFiles(Array.from(e.target.files ?? []))} />
            <Textarea
              rows={2}
              placeholder="Ou cole URLs de imagens, uma por linha"
              value={(form.gallery_urls ?? []).join("\n")}
              onChange={(e) =>
                setForm({ ...form, gallery_urls: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })
              }
            />
            {form.gallery_urls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.gallery_urls.map((u: string, i: number) => (
                  <div key={i} className="relative">
                    <img src={u} alt="" className="h-16 w-16 rounded object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, gallery_urls: form.gallery_urls.filter((_: string, j: number) => j !== i) })}
                      className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-destructive text-xs text-destructive-foreground"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>



          <div className="grid gap-3 rounded-lg border border-border/60 p-4">
            <Label>Traduções (opcional)</Label>
            {(["en", "es"] as const).map((lg) => (
              <div key={lg} className="grid gap-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{lg === "en" ? "Inglês" : "Espanhol"}</p>
                <Input
                  placeholder={`Título em ${lg.toUpperCase()}`}
                  value={form.translations?.[lg]?.title ?? ""}
                  onChange={(e) => setForm({ ...form, translations: { ...form.translations, [lg]: { ...form.translations?.[lg], title: e.target.value } } })}
                />
                <Textarea
                  rows={2}
                  placeholder={`Descrição em ${lg.toUpperCase()}`}
                  value={form.translations?.[lg]?.description ?? ""}
                  onChange={(e) => setForm({ ...form, translations: { ...form.translations, [lg]: { ...form.translations?.[lg], description: e.target.value } } })}
                />
              </div>
            ))}
          </div>

          <div>
            <Label>Tipo de licença</Label>
            <select
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={form.license_type}
              onChange={(e) => setForm({ ...form, license_type: e.target.value })}
            >
              <option value="premium">Premium (venda / créditos)</option>
              <option value="free">Grátis (limite de 5/dia sem assinatura)</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} /> Publicada</label>
            <label className="flex items-center gap-2"><Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} /> Destaque</label>
            <label className="flex items-center gap-2"><Switch checked={form.is_trending} onCheckedChange={(v) => setForm({ ...form, is_trending: v })} /> Em alta</label>
          </div>
          <Button type="submit" disabled={busy} className="w-full bg-gradient-brand text-brand-foreground">{busy ? "Salvando..." : isEdit ? "Salvar" : "Criar"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
