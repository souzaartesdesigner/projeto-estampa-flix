import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, ZoomIn, X, Gift, Crown, Star, Flame } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { SmartImage } from "@/components/smart-image";
import { DETAIL_WIDTHS, THUMB_WIDTHS } from "@/lib/image-cdn";


type Props = {
  images: string[];
  alt: string;
  showWatermark?: boolean;
  licenseType?: string | null;
  isFeatured?: boolean;
  isTrending?: boolean;
};

export function ArtworkGallery({ images, alt, showWatermark = true, licenseType, isFeatured, isTrending }: Props) {
  const list = images.filter(Boolean);
  const [idx, setIdx] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const { t } = useI18n();

  const current = list[idx] ?? list[0];
  const go = (delta: number) => setIdx((i) => (i + delta + list.length) % list.length);

  if (!current) return null;

  return (
    <>
      <div className="flex flex-col gap-3 w-full overflow-hidden">
        {/* Main image */}
        <div className="group relative w-full overflow-hidden rounded-2xl border border-border/60 bg-surface">
          <div className="relative aspect-square w-full">
            <SmartImage
              src={current}
              alt={alt || ""}
              widths={DETAIL_WIDTHS}
              fallbackWidth={800}
              sizes="(max-width: 1024px) 94vw, 640px"
              priority
              className="h-full w-full cursor-zoom-in object-cover transition-transform duration-300 group-hover:scale-105"
              onClick={() => setZoomOpen(true)}
            />

            <div className="absolute left-4 top-4 z-10 flex flex-col gap-2 items-start pointer-events-none">
              {licenseType === "free" ? (
                <span
                  aria-label="Arte gratuita"
                  title="Arte gratuita"
                  className="grid h-8 w-8 place-items-center rounded-full bg-success text-foreground shadow-lg"
                >
                  <Gift className="h-4.5 w-4.5" />
                </span>
              ) : (
                <span
                  aria-label="Arte premium"
                  title="Arte premium"
                  className="grid h-8 w-8 place-items-center rounded-full bg-gradient-brand text-brand-foreground shadow-lg"
                >
                  <Crown className="h-4.5 w-4.5" />
                </span>
              )}
              {isFeatured && (
                <span
                  aria-label={t("card.featured")}
                  title={t("card.featured")}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-yellow-400/50 bg-black shadow-lg"
                >
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </span>
              )}
              {isTrending && (
                <span
                  aria-label={t("card.trending")}
                  title={t("card.trending")}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-orange-500/50 bg-black shadow-lg"
                >
                  <Flame className="h-4 w-4 fill-orange-500 text-orange-500" />
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              aria-label={t("gallery.zoom")}
              className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-background/80 text-foreground opacity-0 backdrop-blur transition-opacity hover:bg-background group-hover:opacity-100"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            {list.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Anterior"
                  className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background/80 opacity-0 backdrop-blur transition-opacity hover:bg-background group-hover:opacity-100"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Próxima"
                  className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-background/80 opacity-0 backdrop-blur transition-opacity hover:bg-background group-hover:opacity-100"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Thumbnails */}
        {list.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {list.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setIdx(i)}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                  i === idx ? "border-primary" : "border-border/50 hover:border-border"
                }`}
              >
                <SmartImage src={src} alt={alt ? `${alt} — imagem ${i + 1}` : ""} widths={THUMB_WIDTHS} fallbackWidth={160} sizes="64px" width={64} height={64} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom modal */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent className="max-h-[95vh] max-w-6xl overflow-hidden border-0 bg-background/95 p-0 backdrop-blur">
          <ZoomViewer src={current} alt={alt} onClose={() => setZoomOpen(false)} onNext={() => go(1)} onPrev={() => go(-1)} multi={list.length > 1} />
        </DialogContent>
      </Dialog>
    </>
  );
}

function ZoomViewer({
  src,
  alt,
  onClose,
  onNext,
  onPrev,
  multi,
}: { src: string; alt: string; onClose: () => void; onNext: () => void; onPrev: () => void; multi: boolean }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, [src]);

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    setScale((s) => Math.min(4, Math.max(1, s + delta)));
  }
  function onMouseDown(e: React.MouseEvent) {
    if (scale === 1) return;
    dragRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragRef.current) return;
    setPos({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y });
  }
  function stopDrag() {
    dragRef.current = null;
  }

  return (
    <div className="relative h-[90vh] w-full select-none">
      <button
        type="button"
        onClick={onClose}
        aria-label={t("gallery.close")}
        className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-background/80 backdrop-blur hover:bg-background"
      >
        <X className="h-5 w-5" />
      </button>
      {multi && (
        <>
          <button
            type="button"
            onClick={onPrev}
            className="absolute left-4 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-background/80 backdrop-blur hover:bg-background"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={onNext}
            className="absolute right-4 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-background/80 backdrop-blur hover:bg-background"
            aria-label="Próxima"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
      <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-background/80 px-3 py-1.5 text-xs backdrop-blur">
        {Math.round(scale * 100)}% — {t("gallery.zoom")}: roda do mouse / clique
      </div>
      <div
        className="flex h-full w-full items-center justify-center overflow-hidden"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onDoubleClick={() => setScale((s) => (s === 1 ? 2 : 1))}
      >
        <img
          src={src}
          alt={alt || ""}
          draggable={false}
          decoding="async"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            cursor: scale > 1 ? "grab" : "zoom-in",
            transition: dragRef.current ? "none" : "transform 0.2s",
          }}
          className="max-h-full max-w-full object-contain"
        />
      </div>
    </div>
  );
}
