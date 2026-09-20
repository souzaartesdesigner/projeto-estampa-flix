import { useMemo, useState } from "react";
import { buildSrcSet, canTransform, transformedUrl, CARD_WIDTHS } from "@/lib/image-cdn";

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "srcSet" | "sizes"> & {
  src: string;
  alt: string;
  /** Larguras geradas no srcset. */
  widths?: number[];
  /** Atributo sizes — descreve o espaço ocupado no layout. */
  sizes?: string;
  /** Largura usada no src de fallback (a menor razoável). */
  fallbackWidth?: number;
  quality?: number;
  /** Imagem crítica (LCP): carrega imediatamente com prioridade alta. */
  priority?: boolean;
};

/**
 * <img> com srcset responsivo + conversão para formato moderno (WebP).
 * Se o CDN de imagens falhar, volta automaticamente para a URL original.
 */
export function SmartImage({
  src,
  alt,
  widths = CARD_WIDTHS,
  sizes,
  fallbackWidth,
  quality,
  priority = false,
  loading,
  decoding = "async",
  ...rest
}: Props) {
  const [failed, setFailed] = useState(false);

  const optimized = useMemo(() => {
    if (failed || !canTransform(src)) return null;
    return {
      src: transformedUrl(src, { width: fallbackWidth ?? widths[Math.floor(widths.length / 2)], quality }),
      srcSet: buildSrcSet(src, widths, { quality }),
    };
  }, [src, widths, fallbackWidth, quality, failed]);

  return (
    <img
      {...rest}
      src={optimized?.src ?? src}
      srcSet={optimized?.srcSet}
      sizes={optimized?.srcSet ? sizes : undefined}
      alt={alt}
      loading={loading ?? (priority ? "eager" : "lazy")}
      fetchPriority={priority ? "high" : rest.fetchPriority}
      decoding={decoding}
      onError={(e) => {
        if (!failed) setFailed(true);
        rest.onError?.(e);
      }}
    />
  );
}
