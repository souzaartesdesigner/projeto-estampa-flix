import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ImageOff, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/site-layout";
import { ArtworkCard } from "@/components/artwork-card";
import { Button } from "@/components/ui/button";
import { readVisualSearch, VISUAL_SEARCH_EVENT, type VisualSearchPayload } from "@/lib/visual-search-store";

export const Route = createFileRoute("/busca-visual")({
  head: () => ({
    meta: [
      { title: "Busca por imagem — Estampa Flix" },
      {
        name: "description",
        content:
          "Envie uma foto ou print e encontre as artes digitais mais parecidas do catálogo Estampa Flix para sublimação e DTF.",
      },
      { property: "og:title", content: "Busca por imagem — Estampa Flix" },
      {
        property: "og:description",
        content: "Encontre estampas semelhantes enviando uma imagem. Resultados por similaridade visual com IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VisualSearchPage,
});

function VisualSearchPage() {
  const [payload, setPayload] = useState<VisualSearchPayload | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setPayload(readVisualSearch());
      setReady(true);
    };
    sync();
    window.addEventListener(VISUAL_SEARCH_EVENT, sync);
    return () => window.removeEventListener(VISUAL_SEARCH_EVENT, sync);
  }, []);

  const results = payload?.results ?? [];

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-4 sm:py-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {payload?.preview && (
              <img
                src={payload.preview}
                alt="Imagem usada na busca"
                className="h-20 w-20 rounded-xl border border-border/50 object-cover"
              />
            )}
            <div>
              <h1 className="flex items-center gap-2 font-display text-2xl font-bold sm:text-3xl">
                <Sparkles className="h-6 w-6 text-primary" /> Busca por imagem
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {results.length > 0
                  ? `${results.length} arte(s) ordenadas por semelhança visual.`
                  : "Resultados da sua busca visual."}
              </p>
            </div>
          </div>
          <Button asChild variant="secondary">
            <Link to="/catalogo" search={{ page: 1 }}>
              Ver catálogo completo
            </Link>
          </Button>
        </header>

        {ready && results.length > 0 && !payload?.exact && (
          <div className="mb-5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
            Não encontramos a arte exata, mas separamos as opções mais parecidas para você:
          </div>
        )}

        {!ready ? null : results.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/50 bg-surface/40 px-6 py-16 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary">
              <ImageOff className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Nenhuma arte semelhante encontrada</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tente outra imagem, com o desenho bem visível e sem muito fundo.
              </p>
            </div>
            <Button asChild>
              <Link to="/catalogo" search={{ page: 1 }}>
                Explorar o catálogo
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {results.map((art) => (
              <div key={art.id} className="relative">
                <ArtworkCard artwork={art as any} />
                <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold text-primary backdrop-blur">
                  {Math.round(art.similarity * 100)}% similar
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
