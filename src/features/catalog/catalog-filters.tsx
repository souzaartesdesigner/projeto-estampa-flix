import { useMemo } from "react";
import { tField, useI18n } from "@/lib/i18n";
import { LICENSES, type CatalogSearch } from "./catalog-constants";
import { FileFormatIcon } from "@/features/artwork/file-format-icon";
import { FilterGroup, FilterOption } from "./filter-group";
import { useNavigate, useParams } from "@tanstack/react-router";

type Props = {
  filters: CatalogSearch;
  categories: any[];
  formats?: string[];
  onChange: (patch: Partial<CatalogSearch>) => void;
  onFilterSelected?: () => void;
};

export function CatalogFilters({ filters, categories, formats = [], onChange, onFilterSelected }: Props) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const search = (params as any).slug ? filters : filters;
  const currentSlug = (params as any).slug || filters.categoria;
  


  const orderedCategories = useMemo(() => {
    const roots = categories.filter((c: any) => !c.parent_id);
    const childrenBy: Record<string, any[]> = {};
    for (const c of categories as any[]) {
      if (c.parent_id) (childrenBy[c.parent_id] ??= []).push(c);
    }
    const out: Array<{ cat: any; depth: number }> = [];
    for (const r of roots) {
      out.push({ cat: r, depth: 0 });
      for (const child of childrenBy[r.id] ?? []) out.push({ cat: child, depth: 1 });
    }
    for (const c of categories as any[]) {
      if (c.parent_id && !categories.find((p: any) => p.id === c.parent_id)) {
        out.push({ cat: c, depth: 0 });
      }
    }
    return out;
  }, [categories]);

  return (
    <>
      <FilterGroup title="Licença">
        <div className="space-y-1">
          <FilterOption
            label="Todas as licenças"
            active={!filters.licenca}
            onClick={() => { onChange({ licenca: undefined }); onFilterSelected?.(); }}
          />
          {LICENSES.map((l) => (
            <FilterOption
              key={l.value}
              label={l.label}
              active={filters.licenca === l.value}
              onClick={() => { onChange({ licenca: filters.licenca === l.value ? undefined : (l.value as any) }); onFilterSelected?.(); }}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title={t("catalog.categories")}>

        <div className="space-y-1">
          {orderedCategories.map(({ cat: c, depth }) => {
            const nm = tField(c as any, "name", lang) || c.name;
            const isActive = currentSlug === c.slug;
            return (
              <FilterOption
                key={c.id}
                label={depth > 0 ? `— ${nm}` : nm}
                active={isActive}
                depth={depth}
                onClick={() => { 
                  if (isActive) {
                    onChange({ categoria: undefined });
                  } else {
                    onChange({ categoria: c.slug });
                  }
                  onFilterSelected?.(); 
                }}
              />
            );
          })}
        </div>
      </FilterGroup>

      {formats.length > 0 && (
        <FilterGroup title={t("catalog.format")}>
          <div className="flex flex-wrap gap-1">
            {formats.map((f: string) => (
              <button
                key={f}
                onClick={() => { onChange({ formato: filters.formato === f ? undefined : f }); onFilterSelected?.(); }}
                className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors ${
                  filters.formato === f ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                }`}
              >
                <FileFormatIcon format={f} />
              </button>

            ))}
          </div>
        </FilterGroup>
      )}
    </>
  );
}
