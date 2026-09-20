import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { slugify } from "@/lib/format";
import { detectFormat } from "@/features/artwork/formats";
import { Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { processExternalImage } from "@/lib/artwork-upload.functions";

export const Route = createFileRoute("/_authenticated/admin/importar")({ component: Importar });

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let i = 0;
  let inQuotes = false;
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQuotes = true; i++; continue; }
    if (c === ",") { row.push(field); field = ""; i++; continue; }
    if (c === "\r") { i++; continue; }
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    field += c; i++;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

function stripHtml(html: string) {
  if (typeof document === 'undefined') return html.replace(/<[^>]*>?/gm, '');
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

function parsePriceToCents(v: string): number {
  if (!v) return 0;
  const s = v.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

function guessFormat(...sources: string[]): string | null {
  return detectFormat(...sources);
}

type LogItem = { title: string; status: "ok" | "error" | "skip"; message?: string };

function Importar() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, currentAction: "" });
  const [log, setLog] = useState<LogItem[]>([]);
  const [defaultCreditCost, setDefaultCreditCost] = useState(1);
  const [defaultFormat, setDefaultFormat] = useState("cdr");
  const [publishAll, setPublishAll] = useState(true);
  const [keepHtml, setKeepHtml] = useState(true);
  const [autoFormat, setAutoFormat] = useState(true);
  const processImage = useServerFn(processExternalImage);

  const categoryCache = new Map<string, string>();
  const tagCache = new Map<string, string>();

  async function ensureTaxonomy(
    table: "categories" | "tags",
    cache: Map<string, string>,
    name: string,
  ): Promise<string | null> {
    const clean = name.trim();
    if (!clean) return null;
    const slug = slugify(clean);
    if (!slug) return null;
    const cached = cache.get(slug);
    if (cached) return cached;

    // UPSERT por slug: se já existir, apenas retorna o registro existente
    const { data, error } = await supabase
      .from(table)
      .upsert({ slug, name: clean }, { onConflict: "slug", ignoreDuplicates: false })
      .select("id")
      .maybeSingle();

    if (data?.id) {
      cache.set(slug, data.id);
      return data.id;
    }

    // Fallback: busca o existente (ex.: upsert bloqueado por RLS de update)
    const { data: existing } = await supabase.from(table).select("id").eq("slug", slug).maybeSingle();
    if (existing?.id) {
      cache.set(slug, existing.id);
      return existing.id;
    }
    if (error) throw error;
    return null;
  }

  async function ensureCategory(name: string): Promise<string | null> {
    return ensureTaxonomy("categories", categoryCache, name);
  }

  async function ensureTag(name: string): Promise<string | null> {
    return ensureTaxonomy("tags", tagCache, name);
  }

  async function uniqueSlug(base: string): Promise<string> {
    let slug = base || `arte-${Date.now()}`;
    let i = 1;
    let finalSlug = slug;
    while (true) {
      const { data } = await supabase.from("artworks").select("id").eq("slug", finalSlug).maybeSingle();
      if (!data) return finalSlug;
      i++;
      finalSlug = `${slug}-${i}`;
    }
  }

  async function importAll() {
    if (!file) { toast.error("Selecione um arquivo CSV"); return; }
    setBusy(true);
    setLog([]);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length < 2) throw new Error("CSV vazio");
      const header = rows[0].map((h) => h.trim());
      const idx = (name: string) => header.indexOf(name);

      const cName = idx("Nome");
      const cPub = idx("Publicado");
      const cDesc = idx("Descrição");
      const cShort = idx("Descrição curta");
      const cPrice = idx("Preço");
      const cSale = idx("Preço promocional");
      const cCats = idx("Categorias");
      const cTags = idx("Tags");
      const cImg = idx("Imagens");
      const cDlUrl = idx("URL do download 1");
      const cExtUrl = idx("URL externa");
      const cSku = idx("SKU"); 
      const cFeat = idx("Em destaque?");
      const cAlt = idx("alt_text");
      
      const findCol = (needle: string) => header.findIndex((h) => h.toLowerCase().includes(needle));
      const cSeoTitle = findCol("wpseo_title");
      const cSeoDesc = findCol("wpseo_metadesc");
      const cSeoKw = findCol("wpseo_focuskw");

      if (cName < 0) throw new Error("Coluna 'Nome' não encontrada");

      const data = rows.slice(1);
      setProgress({ done: 0, total: data.length, currentAction: "Iniciando importação..." });
      const currentLogs: LogItem[] = [];

      const usedSlugsInBatch = new Set<string>();
      const BATCH_SIZE = 3; 
      for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async (row, batchIdx) => {
          const r = i + batchIdx;
          const title = (row[cName] || "").trim();
          if (!title) return;

          let product_code = cSku >= 0 ? (row[cSku] || "").trim() : "";
          if (!product_code) {
            product_code = `EF-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
          }

          try {
            const categoryIds: string[] = [];
            if (cCats >= 0 && row[cCats]) {
              const names = row[cCats].split(",").map((s) => s.trim()).filter(Boolean);
              for (const nm of names) {
                const leaf = nm.split(">").pop()?.trim() || nm;
                const id = await ensureCategory(leaf);
                if (id && !categoryIds.includes(id)) categoryIds.push(id);
              }
            }
            const category_id: string | null = categoryIds[0] ?? null;
            const rawDesc = cDesc >= 0 ? row[cDesc] : "";
            const description = keepHtml ? rawDesc : stripHtml(rawDesc);
            const sale = cSale >= 0 ? parsePriceToCents(row[cSale]) : 0;
            const regular = cPrice >= 0 ? parsePriceToCents(row[cPrice]) : 0;
            const price_cents = sale > 0 ? sale : regular;

            const rawImageUrls = (cImg >= 0 ? row[cImg] : "").split(",").map((s) => s.trim()).filter((s) => /^https?:\/\//i.test(s));
            if (rawImageUrls.length === 0) throw new Error("Sem URL de imagem");

            let preview_url = "";
            try {
              preview_url = await processImage({ data: { url: rawImageUrls[0], folder: "arts" } });
            } catch (imgErr) {
              console.error("Falha crítica ao transferir imagem principal:", imgErr);
              throw new Error(`Erro no download: ${imgErr instanceof Error ? imgErr.message : String(imgErr)}`);
            }

            const gallery_urls: string[] = [];
            const rawGallery = Array.from(new Set(rawImageUrls.slice(1))).slice(0, 12);
            for (const gUrl of rawGallery) {
              try {
                const internalUrl = await processImage({ data: { url: gUrl, folder: "gallery" } });
                gallery_urls.push(internalUrl);
              } catch (imgErr) {
                console.warn("Falha ao transferir imagem da galeria, ignorando:", imgErr);
              }
            }

            const external_url = (cDlUrl >= 0 ? row[cDlUrl] : "").trim() || (cExtUrl >= 0 ? row[cExtUrl] : "").trim() || null;
            const is_published = cPub >= 0 ? (row[cPub] || "").trim() === "1" : publishAll;
            const is_featured = cFeat >= 0 ? (row[cFeat] || "").trim() === "1" : false;
            const shortDesc = cShort >= 0 ? stripHtml(row[cShort] || "").replace(/\s+/g, " ").trim() : "";
            const plainDesc = stripHtml(rawDesc).replace(/\s+/g, " ").trim();
            const rawSeoTitle = (cSeoTitle >= 0 ? (row[cSeoTitle] || "").trim() : "") || "%%title%% — Estampa Flix";
            const rawSeoDesc = (cSeoDesc >= 0 ? (row[cSeoDesc] || "").trim() : "") || (shortDesc || plainDesc || "%%title%%: arte digital em alta resolução.");
            const rawSeoKw = (cSeoKw >= 0 ? (row[cSeoKw] || "").trim() : "") || "%%title%%";

            const cleanSeoTitle = rawSeoTitle.replace(/%%title%%/gi, title);
            const cleanSeoDesc = rawSeoDesc.replace(/%%title%%/gi, title);
            const cleanSeoKw = rawSeoKw.replace(/%%title%%/gi, title);
            const baseSlug = slugify(title) || `arte-${Date.now()}`;
            
            // Verifica se existe no banco
            const { data: existingInDb } = await supabase.from("artworks").select("id").eq("slug", baseSlug).maybeSingle();
            
            let slug = baseSlug;
            // Se existir no banco OU já tiver sido usado neste batch, gera com sufixo
            if (existingInDb || usedSlugsInBatch.has(baseSlug)) {
              const shortHash = Math.random().toString(36).substring(2, 7);
              slug = `${baseSlug}-${shortHash}`;
            }
            
            usedSlugsInBatch.add(slug);

            const payload = {
              title,
              slug,
              description,
              category_id,
              preview_url,
              gallery_urls,
              product_code,
              seo_title: cleanSeoTitle.slice(0, 70),
              seo_description: cleanSeoDesc.slice(0, 160),
              seo_keyword: cleanSeoKw.slice(0, 120),
              alt_text: cAlt >= 0 ? (row[cAlt] || "").trim() || null : null,
              file_path: null,
              external_url,
              file_format: (autoFormat ? guessFormat(external_url ?? "", title, cTags >= 0 ? row[cTags] : "", rawDesc) : null) || defaultFormat.trim().toLowerCase().replace(/^\./, ""),
              price_cents,
              credit_cost: defaultCreditCost,
              is_published: publishAll ? true : is_published,
              is_featured,
            };

            const { data: ins, error: insError } = await supabase.from("artworks").insert(payload).select("id").single();
            if (insError) throw insError;
            const artworkId = ins.id;

            if (categoryIds.length) {
              await supabase.from("artwork_categories").upsert(
                categoryIds.map((cid) => ({ artwork_id: artworkId, category_id: cid })),
                { onConflict: "artwork_id,category_id", ignoreDuplicates: true },
              );
            }

            if (cTags >= 0 && row[cTags]) {
              const tagNames = row[cTags].split(",").map((s) => s.trim()).filter(Boolean).slice(0, 15);
              const tagIds: string[] = [];
              for (const tn of tagNames) {
                const id = await ensureTag(tn);
                if (id) tagIds.push(id);
              }
              if (tagIds.length) {
                await supabase.from("artwork_tags").upsert(
                  tagIds.map((tid) => ({ artwork_id: artworkId, tag_id: tid })),
                  { onConflict: "artwork_id,tag_id", ignoreDuplicates: true },
                );
              }
            }
            currentLogs.push({ title, status: "ok", message: "criado" });
          } catch (err: any) {
            currentLogs.push({ title: title || `Linha ${r + 2}`, status: "error", message: err.message || String(err) });
          }
        }));
        setProgress(p => ({ ...p, done: Math.min(i + BATCH_SIZE, data.length) }));
        setLog([...currentLogs]);
      }
      toast.success(`Importação concluída!`);
    } catch (err: any) {
      toast.error(err.message || "Erro na importação");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Importar CSV do WooCommerce</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Envie o arquivo CSV para processamento. As imagens serão transferidas automaticamente para o Supabase Storage.
        </p>
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
        <div className="grid gap-2">
          <Label>Arquivo CSV</Label>
          <Input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label>Custo em créditos (padrão)</Label>
            <Input type="number" min={0} value={defaultCreditCost} onChange={(e) => setDefaultCreditCost(Number(e.target.value))} />
          </div>
          <div className="grid gap-2">
            <Label>Formato padrão</Label>
            <Input value={defaultFormat} onChange={(e) => setDefaultFormat(e.target.value)} />
          </div>
          <div className="flex flex-col justify-end gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={publishAll} onCheckedChange={setPublishAll} /> Publicar todos
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={keepHtml} onCheckedChange={setKeepHtml} /> Manter HTML
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={autoFormat} onCheckedChange={setAutoFormat} /> Detectar formato
            </label>
          </div>
        </div>

        <Button onClick={importAll} disabled={!file || busy} className="bg-gradient-brand text-brand-foreground">
          {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</> : <><Upload className="mr-2 h-4 w-4" /> Iniciar Importação</>}
        </Button>

        {progress.total > 0 && (
          <div className="text-sm text-muted-foreground">
            Processando: {progress.done} / {progress.total}
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      {log.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Resultado da Importação</h2>
          <ul className="max-h-96 space-y-1 overflow-y-auto text-sm">
            {log.map((l, i) => (
              <li key={i} className="flex items-start gap-2 py-1 border-b border-border/40 last:border-0">
                {l.status === "ok" ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 text-destructive shrink-0" />}
                <span className="flex-1 font-medium">{l.title}</span>
                <span className="text-xs text-muted-foreground">{l.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
