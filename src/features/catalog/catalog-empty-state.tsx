import { Search, X } from "lucide-react";
import type { CatalogSearch } from "./catalog-constants";

const FILTER_LABELS: Record<string, string> = {
  q: "Busca",
  categoria: "Categoria",
  formato: "Formato",
  cor: "Cor",
  licenca: "Licença",
};

type Props = {
  mode: "search" | "filters";
  activeFilters: Array<[keyof CatalogSearch, string]>;
  onRemoveFilter: (key: keyof CatalogSearch) => void;
  onClearFilters: () => void;
};

export function CatalogEmptyState({ mode, activeFilters, onRemoveFilter, onClearFilters }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/40 px-4 py-14 text-center sm:px-8">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30 shadow-[0_0_30px_-6px_hsl(var(--primary)/0.5)]">
        <Search className="h-7 w-7 text-primary" />
      </div>

      <h2 className="text-xl font-bold text-foreground sm:text-2xl">Nenhuma arte encontrada</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {mode === "search"
          ? "Tente buscar por outro termo ou explore nossas coleções."
          : "Tente remover alguns filtros para ampliar sua busca."}
      </p>

      {mode === "filters" && activeFilters.length > 0 && (
        <div className="mt-8 w-full max-w-md">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border/70" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Filtros aplicados
            </span>
            <span className="h-px flex-1 bg-border/70" />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {activeFilters.map(([key, value]) => (
              <span
                key={String(key)}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-foreground"
              >
                <span className="text-muted-foreground">{FILTER_LABELS[String(key)] ?? String(key)}:</span>
                {value}
                <button
                  type="button"
                  aria-label={`Remover filtro ${FILTER_LABELS[String(key)] ?? String(key)}`}
                  onClick={() => onRemoveFilter(key)}
                  className="ml-0.5 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-primary/20 hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={onClearFilters}
            className="mt-5 inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            <X className="h-3.5 w-3.5" />
            Limpar todos os filtros
          </button>
        </div>
      )}
    </div>
  );
}
