import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SmartImage } from "@/components/smart-image";
import { HERO_WIDTHS } from "@/lib/image-cdn";


export function HeroBanners({ banners }: { banners: any[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => setActive(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (paused || banners.length <= 1) return;
    const id = setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % banners.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, 5000);
    return () => clearInterval(id);
  }, [paused, banners.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const next = Math.min(banners.length - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth) + dir));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  if (banners.length === 0) return null;

  return (
    <section
      className="relative mx-auto w-full max-w-7xl px-4 pt-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-2xl">
        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {banners.map((b) => {
            const content = (
              <div className="relative aspect-[21/9] w-full overflow-hidden bg-surface-2 sm:aspect-[21/8]">
                <SmartImage
                  src={b.image_url}
                  alt={b.title || ""}
                  widths={HERO_WIDTHS}
                  fallbackWidth={1280}
                  sizes="(max-width: 768px) 100vw, 1200px"
                  quality={72}
                  priority
                  className="h-full w-full object-cover"
                />

                {(b.title || b.subtitle || b.cta_label) && (
                  <div className="absolute inset-0 flex flex-col justify-end gap-2 bg-gradient-to-t from-background/80 via-background/20 to-transparent p-6 sm:p-10">
                    {b.title && <h2 className="font-display text-2xl font-black sm:text-4xl">{b.title}</h2>}
                    {b.subtitle && <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{b.subtitle}</p>}
                    {b.cta_label && (
                      <span className="mt-1 inline-flex w-fit rounded-full bg-gradient-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-brand">
                        {b.cta_label}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
            return (
              <div key={b.id} className="w-full flex-none snap-start">
                {b.link_url ? (
                  b.link_url.startsWith("http") ? (
                    <a href={b.link_url} target="_blank" rel="noopener noreferrer">{content}</a>
                  ) : (
                    <Link to={b.link_url as any}>{content}</Link>
                  )
                ) : (
                  content
                )}
              </div>
            );
          })}
        </div>

        {banners.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Anterior"
              onClick={() => scrollBy(-1)}
              className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-primary shadow ring-1 ring-border/60 backdrop-blur hover:bg-primary hover:text-primary-foreground sm:h-12 sm:w-12"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="Próximo"
              onClick={() => scrollBy(1)}
              className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-primary shadow ring-1 ring-border/60 backdrop-blur hover:bg-primary hover:text-primary-foreground sm:h-12 sm:w-12"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {banners.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-primary" : "w-1.5 bg-background/60"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
