import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, ExternalLink, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/seo-check")({ component: SeoCheckPage });

const ITEMS_PER_PAGE = 50;

type Row = {
  id: string;
  slug: string;
  title: string;
  seo_title: string | null;
  seo_description: string | null;
  seo_keyword: string | null;
  alt_text: string | null;
  noindex: boolean;
  is_published: boolean;
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function issuesOf(a: Row) {
  const out: string[] = [];
  const desc = (a.seo_description ?? "").trim();
  if (!desc) out.push("Sem meta description");
  else if (desc.length < 50 || desc.length > 160) out.push(`Meta description com ${desc.length} caracteres`);
  if (!(a.alt_text ?? "").trim()) out.push("Sem alt text");
  if (!(a.seo_keyword ?? "").trim()) out.push("Sem frase-chave foco");
  if (!SLUG_RE.test(a.slug ?? "")) out.push("Slug não amigável");
  if (a.noindex) out.push("Marcada como noindex");
  return out;
}

function SeoCheckPage() {
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [onlyIssues, setOnlyIssues] = useState(true);
  const [page, setPage] = useState(0);

  // Debounce busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(searchInput);
      setPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-seo-check-paginated", page, q, onlyIssues],
    queryFn: async () => {
      let query = supabase
        .from("artworks")
        .select("id,slug,title,seo_title,seo_description,seo_keyword,alt_text,noindex,is_published", { count: "exact" })
        .eq("is_published", true);

      if (q) {
        query = query.or(`title.ilike.%${q}%,slug.ilike.%${q}%`);
      }

      // Infelizmente o PostgREST não filtra por lógica complexa de 'issuesOf' no servidor
      // Então buscamos uma gama maior e filtramos no client, ou mantemos paginação server-side
      // e o usuário vê as pendências daquela página.
      
      const { data, count, error } = await query
        .order("created_at", { ascending: false })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);
      
      if (error) throw error;
      
      const rows = (data ?? []) as unknown as Row[];
      return { rows, total: count ?? 0 };
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-seo-stats"],
    queryFn: async () => {
      const { count } = await supabase.from("artworks").select("id", { count: "exact", head: true }).eq("is_published", true);
      return { total: count ?? 0 };
    }
  });

  const artworks = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const filteredRows = useMemo(
    () =>
      artworks
        .map((a) => ({ a, issues: issuesOf(a) }))
        .filter(({ issues }) => (onlyIssues ? issues.length > 0 : true)),
    [artworks, onlyIssues],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 font-display text-2xl font-bold">SEO Check</h1>
        <p className="text-sm text-muted-foreground">
          Auditoria das artes publicadas: meta description, alt text, frase-chave, slug e noindex.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">Artes publicadas</p>
          <p className="font-display text-2xl font-bold">{stats?.total ?? "..."}</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">Página atual</p>
          <p className="font-display text-2xl font-bold">{artworks.length} artes</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            value={searchInput} 
            onChange={(e) => setSearchInput(e.target.value)} 
            placeholder="Buscar por título ou slug" 
            className="pl-9" 
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input 
            type="checkbox" 
            className="h-4 w-4 rounded border-border" 
            checked={onlyIssues} 
            onChange={(e) => setOnlyIssues(e.target.checked)} 
          />
          Mostrar apenas com pendências (nesta página)
        </label>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : filteredRows.length === 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
          <CheckCircle2 className="h-5 w-5 text-success" /> Nenhuma pendência encontrada nesta página.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Arte</th>
                <th className="p-3">Pendências</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(({ a, issues }) => (
                <tr key={a.id} className="border-t border-border/50 align-top">
                  <td className="p-3">
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">/{a.slug}</p>
                  </td>
                  <td className="p-3">
                    {issues.length === 0 ? (
                      <Badge className="bg-success/15 text-success">OK</Badge>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {issues.map((i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive"
                          >
                            <AlertTriangle className="h-3 w-3" /> {i}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-3">
                      <Link to="/admin/artes" className="text-xs text-primary hover:underline">
                        Editar
                      </Link>
                      <a
                        href={`/artes/${a.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Ver <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm">Página {page + 1} de {totalPages}</span>
          <Button variant="outline" size="icon" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}