import { useRef, useState } from "react";
import { Loader2, ScanSearch, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { backfillArtworkEmbeddings } from "@/lib/visual-search.functions";

export function VisualIndexPanel() {
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<{ done: number; total: number; failures: number } | null>(null);
  const stopRef = useRef(false);

  async function run() {
    setRunning(true);
    stopRef.current = false;
    let failures = 0;
    try {
      // Processa em lotes até indexar todas as artes publicadas.
      for (;;) {
        if (stopRef.current) break;
        const res = await backfillArtworkEmbeddings({ data: { batchSize: 10 } });
        failures += res.failures.length;
        setStatus({ done: res.done, total: res.total, failures });
        if (res.indexed === 0) break;
      }
      toast.success("Indexação de imagens concluída.");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao indexar imagens.");
    } finally {
      setRunning(false);
    }
  }

  const pct = status && status.total > 0 ? Math.min(100, Math.round((status.done / status.total) * 100)) : 0;

  return (
    <div className="rounded-xl border border-border/50 bg-surface/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-medium">
            <ScanSearch className="h-4 w-4 text-primary" /> Busca por imagem (IA)
          </h2>
          <p className="text-sm text-muted-foreground">
            Indexe as artes para que os clientes possam encontrá-las enviando uma foto.
          </p>
        </div>
        <div className="flex gap-2">
          {running && (
            <Button variant="secondary" onClick={() => (stopRef.current = true)}>
              <StopCircle className="mr-2 h-4 w-4" /> Parar
            </Button>
          )}
          <Button onClick={run} disabled={running}>
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanSearch className="mr-2 h-4 w-4" />}
            {running ? "Indexando…" : "Indexar artes"}
          </Button>
        </div>
      </div>

      {status && (
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {status.done} de {status.total} artes indexadas ({pct}%)
            {status.failures > 0 ? ` · ${status.failures} falha(s)` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
