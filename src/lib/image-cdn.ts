/**
 * Pipeline de transformação de imagens.
 *
 * Desativado conforme solicitação para evitar hotlinking e garantir independência total.
 * O sistema agora faz o download real das imagens e as armazena no Supabase Storage.
 */

/** Formatos de saída suportados pelo pipeline, em ordem de preferência. */
export type ImageFormat = "avif" | "webp" | "origin";

export const ENABLED_FORMATS: ImageFormat[] = ["webp"];

export const CARD_WIDTHS = [480, 960, 1200];
export const HERO_WIDTHS = [800, 1600, 2400];
export const DETAIL_WIDTHS = [1000, 2000];
export const THUMB_WIDTHS = [240, 480];

export const MOBILE_BREAKPOINTS = {
  card: 480,
  thumb: 320,
};

/** 
 * Desativado o proxy globalmente.
 */
export function canTransform(src: string | null | undefined): src is string {
  return false;
}

type TransformOptions = {
  width: number;
  quality?: number;
  format?: ImageFormat;
  height?: number;
};

export function transformedUrl(src: string, opts: TransformOptions): string {
  return src;
}

export function buildSrcSet(
  src: string,
  widths: number[],
  opts: Omit<TransformOptions, "width"> = {},
): string | undefined {
  return undefined;
}
