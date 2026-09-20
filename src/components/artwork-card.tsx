import { Link, useNavigate } from "@tanstack/react-router";
import { formatBRL } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { SmartImage } from "@/components/smart-image";
import { CARD_WIDTHS } from "@/lib/image-cdn";



import { FavoriteButton } from "./favorite-button";

import { ShoppingCart, Check, Crown, Gift, Star, Flame } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useI18n, tField } from "@/lib/i18n";

export type ArtworkCardData = {
  id: string;
  slug: string;
  title: string;
  preview_url: string;
  price_cents: number;
  license_type?: string | null;
  is_featured?: boolean;
  is_trending?: boolean;
  download_count?: number | null;
  translations?: any;
  categories?: { id?: string; name: string; slug: string; translations?: any } | null;
  artwork_categories?: Array<{ categories: { id?: string; name: string; slug: string; translations?: any } | null }> | null;
  alt_text?: string | null;
};

export function ArtworkCard({ artwork }: { artwork: ArtworkCardData }) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const cart = useCart();
  const inCart = cart.contains(artwork.id);
  const title = tField(artwork as any, "title", lang) || artwork.title;
  const cats = [
    ...(artwork.categories ? [artwork.categories] : []),
    ...((artwork.artwork_categories ?? []).map((r) => r.categories).filter(Boolean) as NonNullable<ArtworkCardData["categories"]>[]),
  ].filter((c, i, arr) => arr.findIndex((x) => x!.slug === c!.slug) === i);
  return (
    <Link
      to="/artes/$slug"
      params={{ slug: artwork.slug }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-card transition-colors duration-300 hover:border-primary/50"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-2">
        {artwork.preview_url ? (
          <SmartImage
            src={artwork.preview_url}
            alt={artwork.alt_text?.trim() || title}
            widths={CARD_WIDTHS}
            fallbackWidth={400}
            sizes="(max-width: 640px) 92vw, (max-width: 768px) 46vw, (max-width: 1280px) 25vw, 400px"
            width={400}
            height={400}
            className="h-full w-full object-cover"
          />

        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">{t("card.noImage")}</div>
        )}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-2 items-start">
          {artwork.license_type === "free" ? (
            <span
              aria-label="Arte gratuita"
              title="Arte gratuita"
              className="grid h-7 w-7 place-items-center rounded-full bg-success text-foreground shadow-sm"
            >
              <Gift className="h-4 w-4" />
            </span>
          ) : (
            <span
              aria-label="Arte premium"
              title="Arte premium"
              className="grid h-7 w-7 place-items-center rounded-full bg-gradient-brand text-brand-foreground shadow-sm"
            >
              <Crown className="h-4 w-4" />
            </span>
          )}
          {artwork.is_featured && (
            <span
              aria-label={t("card.featured")}
              title={t("card.featured")}
              className="w-7 h-7 rounded-full bg-black flex items-center justify-center shadow-sm border border-yellow-400/50"
            >
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            </span>
          )}
          {artwork.is_trending && (
            <span
              aria-label={t("card.trending")}
              title={t("card.trending")}
              className="w-7 h-7 rounded-full bg-black flex items-center justify-center shadow-sm border border-orange-500/50"
            >
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
            </span>
          )}
        </div>

        <FavoriteButton
          artworkId={artwork.id}
          size="sm"
          className="absolute right-2.5 top-2.5 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
        />
        <button
          type="button"
          disabled={inCart || cart.adding}
          aria-label={inCart ? "No carrinho" : "Adicionar ao carrinho"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!inCart) cart.add(artwork as any);
          }}
          className="absolute right-2.5 top-12 grid h-8 w-8 place-items-center rounded-full border border-border/60 bg-background/80 backdrop-blur transition-all hover:bg-background disabled:border-primary/60 disabled:text-primary [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:focus-visible:opacity-100 [@media(hover:hover)]:group-hover:opacity-100"
        >
          {inCart ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center gap-1 p-3.5 text-center">
        <h3 className="line-clamp-3 text-sm font-semibold tracking-tight text-foreground/95 transition-colors group-hover:text-primary md:line-clamp-none">
          {title}
        </h3>
        <div className="mt-auto flex w-full flex-row items-center justify-between gap-2 pt-2 md:text-left">
          <span className="font-display text-base font-bold tracking-tight text-foreground md:order-1 md:shrink-0">
            {artwork.license_type === "free" ? "Grátis" : formatBRL(artwork.price_cents)}
          </span>
          {cats.length > 0 && (
            <div className="line-clamp-2 min-w-0 text-[12px] text-muted-foreground md:order-2 md:text-right">
              {cats.slice(0, 2).map((c, idx) => (
                <span key={c!.slug}>
                  {idx > 0 && " · "}
                  <button
                    type="button"
                    className="hover:text-primary transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate({ to: "/catalogo/$slug", params: { slug: c!.slug }, search: { page: 1 } });
                    }}
                  >
                    {tField(c as any, "name", lang) || c!.name}
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>




    </Link>
  );
}

