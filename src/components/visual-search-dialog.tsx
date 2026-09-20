import { useCallback, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Camera, ImageUp, Loader2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { searchArtworksByImage } from "@/lib/visual-search.functions";
import { fileToDataUrl, saveVisualSearch } from "@/lib/visual-search-store";
import { cn } from "@/lib/utils";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export function VisualSearchDialog({ className, variant = "field" }: { className?: string; variant?: "field" | "inline" }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPreview(null);
    setError(null);
    setLoading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError("Envie uma imagem .jpg, .png ou .webp.");
      return;
    }
    try {
      setPreview(await fileToDataUrl(file));
    } catch {
      setError("Não foi possível ler essa imagem.");
    }
  }, []);

  async function runSearch() {
    if (!preview) return;
    setLoading(true);
    setError(null);
    try {
      const res = await searchArtworksByImage({ data: { dataUrl: preview, limit: 24 } });
      saveVisualSearch({ results: res.results as any, exact: res.exact, preview, at: Date.now() });
      setOpen(false);
      reset();
      navigate({ to: "/busca-visual" });
    } catch (e: any) {
      setError(e?.message ?? "Não foi possível concluir a busca. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Buscar por imagem"
          title="Buscar por imagem"
          className={cn(
            "grid place-items-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary",
            variant === "field"
              ? "absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2"
              : "h-10 w-10",
            className,
          )}
        >
          <Camera className={variant === "field" ? "h-4 w-4" : "h-5 w-5"} />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Busca por imagem
          </DialogTitle>
          <DialogDescription>
            Envie uma foto ou print e a IA encontra as artes mais parecidas do catálogo.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 text-sm text-primary">
              <Loader2 className="h-4 w-4 animate-spin" /> Analisando sua imagem com IA...
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
        ) : preview ? (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-xl border border-border/60 bg-surface/50">
              <img src={preview} alt="Imagem enviada para busca" className="mx-auto max-h-64 object-contain" />
              <button
                type="button"
                onClick={reset}
                aria-label="Remover imagem"
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/80 text-foreground backdrop-blur transition hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Button onClick={runSearch} className="w-full bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90">
              Buscar artes parecidas
            </Button>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) void handleFile(file);
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
              dragging ? "border-primary bg-primary/10" : "border-border/60 hover:border-primary/60 hover:bg-surface/50",
            )}
          >
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary">
              <ImageUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium">Arraste uma imagem aqui</p>
              <p className="text-xs text-muted-foreground">ou clique para selecionar (.jpg, .png, .webp)</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED.join(",")}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
