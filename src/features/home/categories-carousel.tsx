import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, FileText as FileIcon, Palette } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { tField, useI18n } from "@/lib/i18n";
import { SmartImage } from "@/components/smart-image";
import { THUMB_WIDTHS } from "@/lib/image-cdn";


export function CategoriesCarousel({ categories }: { categories: any[] }) {
  const { t, lang } = useI18n();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);
  const [activePage, setActivePage] = useState(0);
  const [paused, setPaused] = useState(false);

  const recompute = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const pages = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
    setPageCount(pages);
    setActivePage(Math.round(el.scrollLeft / el.clientWidth));
  };

  useEffect(() => {
    recompute();
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => setActivePage(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", onScroll); ro.disconnect(); };
  }, [categories.length]);

  useEffect(() => {
    if (paused || pageCount <= 1) return;
    const id = setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % pageCount;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, 4000);
    return () => clearInterval(id);
  }, [paused, pageCount]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const next = Math.min(pageCount - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth) + dir));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <button
        type="button"
        aria-label={t("home.previous")}
        onClick={() => scrollByPage(-1)}
        className="absolute left-1 top-1/3 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-primary shadow-lg ring-1 ring-border/60 backdrop-blur transition hover:bg-primary hover:text-primary-foreground md:-left-5"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label={t("home.next")}
        onClick={() => scrollByPage(1)}
        className="absolute right-1 top-1/3 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-primary shadow-lg ring-1 ring-border/60 backdrop-blur transition hover:bg-primary hover:text-primary-foreground md:-right-5"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:gap-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((c: any) => {
          const samples: any[] = c.samples ?? [];
          const filled = [...samples, ...Array(Math.max(0, 4 - samples.length)).fill(null)];
          const catName = tField(c as any, "name", lang) || c.name;
          return (
            <Link
              key={c.id}
              to="/catalogo/$slug"
              params={{ slug: c.slug }}
              search={{ page: 1 } as any}
              className="group w-[70%] flex-none snap-start sm:w-[260px] md:w-[280px]"
            >
              <div className="grid grid-cols-2 grid-rows-2 gap-2">
                {filled.slice(0, 4).map((s, i) => (
                  <div key={i} className="aspect-square overflow-hidden rounded-md bg-[#ebebeb] ring-1 ring-border/40">
                    {s ? (
                      <SmartImage src={s.preview_url} alt={s.alt_text?.trim() || s.title || catName} widths={THUMB_WIDTHS} fallbackWidth={160} sizes="140px" width={200} height={200} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : c.cover_url && i === 0 ? (
                      <SmartImage src={c.cover_url} alt={catName} widths={THUMB_WIDTHS} fallbackWidth={160} sizes="140px" width={200} height={200} className="h-full w-full object-cover" />

                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                        <Palette className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between px-1">
                <span className="text-sm font-semibold text-foreground group-hover:text-primary">{catName}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FileIcon className="h-3.5 w-3.5" />
                  {c.count}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {pageCount > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${t("home.next")} ${i + 1}`}
              onClick={() => {
                const el = scrollerRef.current;
                if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
              }}
              className={`h-2 rounded-full transition-all ${i === activePage ? "w-6 bg-primary" : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/70"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
