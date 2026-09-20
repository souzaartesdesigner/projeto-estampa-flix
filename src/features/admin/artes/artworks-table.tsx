import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatBRL } from "@/lib/format";

type Props = {
  artworks: any[];
  onEdit: (artwork: any) => void;
  onDelete: (id: string) => void;
  selected: string[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
};

export function ArtworksTable({ artworks, onEdit, onDelete, selected, onToggle, onToggleAll }: Props) {
  const allSelected = artworks.length > 0 && selected.length === artworks.length;
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-surface-2 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="w-10 px-3 py-3"><Checkbox checked={allSelected} onCheckedChange={onToggleAll} /></th>
            <th className="px-4 py-3 text-left">Arte</th>
            <th className="px-4 py-3 text-left">Categoria</th>
            <th className="px-4 py-3 text-left">Licença</th>
            <th className="px-4 py-3 text-left">Preço</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {artworks.map((a: any) => (
            <tr key={a.id} className="border-t border-border/40">
              <td className="px-3 py-3"><Checkbox checked={selected.includes(a.id)} onCheckedChange={() => onToggle(a.id)} /></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <img src={a.preview_url} alt="" className="h-10 w-10 rounded object-cover" />
                  <div className="flex flex-col">
                    <span className="font-medium">{a.title}</span>
                    {a.product_code && <span className="text-xs text-muted-foreground">SKU: {a.product_code}</span>}
                    <span className="text-[10px] text-muted-foreground/60">{a.slug}</span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{a.categories?.name ?? "—"}</td>
              <td className="px-4 py-3">
                {a.license_type === "free" ? (
                  <Badge className="border-0 bg-success text-background">Gratuito</Badge>
                ) : (
                  <Badge className="border-0 bg-gradient-brand text-brand-foreground">Premium</Badge>
                )}
              </td>
              <td className="px-4 py-3">{formatBRL(a.price_cents)}</td>
              <td className="px-4 py-3">
                {a.is_published ? <Badge>Publicada</Badge> : <Badge variant="secondary">Rascunho</Badge>}
              </td>
              <td className="px-4 py-3 text-right">
                <Button size="icon" variant="ghost" onClick={() => onEdit(a)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => { if (confirm("Excluir esta arte?")) onDelete(a.id); }}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </td>
            </tr>
          ))}
          {artworks.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Nenhuma arte cadastrada.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
