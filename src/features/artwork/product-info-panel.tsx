import { BookOpen, Download, FileType, Hash, LayoutGrid, Maximize, Ruler, ShieldCheck, Tag as TagIcon, Wrench, Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { formatDescription, formatLabel } from "./formats";
import { FileFormatIcon } from "./file-format-icon";


type Row = { icon: React.ReactNode; label: string; value: React.ReactNode };

export function ProductInfoPanel({ artwork }: { artwork: any }) {
  const fmt = artwork.file_format as string | null;
  const fmtLabel = formatLabel(fmt);
  const fmtDesc = formatDescription(fmt);
  const sku = artwork.product_code?.trim();

  const rows: Row[] = [];

  if (fmt) {
    rows.push({
      icon: <FileType className="h-4 w-4" />,
      label: "Formato do arquivo",
      value: (
        <span className="flex flex-wrap items-center gap-2">
          <FileFormatIcon format={fmt} />
          <span>{fmtDesc}</span>
        </span>
      ),

    });
  }

  const cats: any[] = [
    ...(artwork.categories ? [artwork.categories] : []),
    ...((artwork.artwork_categories ?? []).map((r: any) => r.categories).filter(Boolean)),
  ].filter((c, i, arr) => arr.findIndex((x) => x.slug === c.slug) === i);

  if (cats.length > 0) {
    rows.push({
      icon: <LayoutGrid className="h-4 w-4" />,
      label: cats.length > 1 ? "Categorias" : "Categoria",
      value: (
        <span className="flex flex-wrap gap-x-2 gap-y-1">
          {cats.map((c, i) => (
            <span key={c.slug}>
              <Link to="/catalogo" search={{ categoria: c.slug, page: 1 } as any} className="text-primary hover:underline">
                {c.name}
              </Link>
              {i < cats.length - 1 && <span className="text-muted-foreground">,</span>}
            </span>
          ))}
        </span>
      ),
    });
  }


  if (artwork.resolution) {
    rows.push({ icon: <Maximize className="h-4 w-4" />, label: "Resolução", value: artwork.resolution });
  }
  if (artwork.dimensions) {
    rows.push({ icon: <Ruler className="h-4 w-4" />, label: "Dimensões", value: artwork.dimensions });
  }
  if (artwork.tech_specs) {
    rows.push({
      icon: <Wrench className="h-4 w-4" />,
      label: "Especificações técnicas",
      value: <span className="whitespace-pre-line">{artwork.tech_specs}</span>,
    });
  }

  rows.push({ icon: <Zap className="h-4 w-4" />, label: "Entrega", value: "Download imediato após a compra" });

  if (artwork.usage_instructions) {
    rows.push({
      icon: <BookOpen className="h-4 w-4" />,
      label: "Instruções de uso",
      value: <span className="whitespace-pre-line">{artwork.usage_instructions}</span>,
    });
  }

  rows.push({
    icon: <ShieldCheck className="h-4 w-4" />,
    label: "Licença",
    value: artwork.license_text ? (
      <span className="whitespace-pre-line">{artwork.license_text}</span>
    ) : (
      <Link to="/licenca" className="text-primary hover:underline">
        Licença de uso comercial
      </Link>
    ),
  });

  if ((artwork.download_count ?? 0) > 0) {
    rows.push({
      icon: <Download className="h-4 w-4" />,
      label: "Downloads",
      value: `+ de ${artwork.download_count} downloads realizados`,
    });
  }

  if (sku) {
    rows.push({ icon: <Hash className="h-4 w-4" />, label: "Código do produto", value: sku });
  }

  const tags: any[] = artwork.artwork_tags?.map((at: any) => at.tags).filter(Boolean) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <section className="mt-6 rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur sm:p-5">
        <h2 className="mb-3 font-display text-base font-semibold sm:text-lg">Informações do produto</h2>
        <dl className="divide-y divide-border/50 text-sm">
          {rows.map((r, i) => (
            <div key={i} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-start sm:gap-4">
              <dt className="flex min-w-[170px] items-center gap-2 text-muted-foreground">
                <span className="text-primary">{r.icon}</span>
                {r.label}
              </dt>
              <dd className="flex-1 text-foreground">{r.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {tags.length > 0 && (
        <div className="lg:hidden">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tags</h3>
          <div className="flex flex-wrap gap-1">
            {tags.map((tg: any) => (
              <Link key={tg.id} to="/catalogo" search={{ tag: tg.slug, page: 1 } as any}>
                <div className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80">
                  <TagIcon className="h-3 w-3" /> {tg.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
