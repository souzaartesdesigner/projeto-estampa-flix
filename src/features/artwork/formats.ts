/**
 * Catálogo central de formatos de arquivo.
 * Cada formato tem rótulo curto, nome do programa e a frase descritiva
 * exibida na página do produto (padrão Designi).
 */

export type FormatKey =
  | "psd"
  | "png"
  | "cdr"
  | "ai"
  | "eps"
  | "svg"
  | "pdf"
  | "jpg"
  | "webp"
  | "zip";

export type FormatInfo = {
  key: FormatKey;
  label: string;
  program: string;
  description: string;
};

export const FORMATS: Record<FormatKey, FormatInfo> = {
  psd: { key: "psd", label: "PSD", program: "Adobe Photoshop", description: "Arquivo no formato PSD editável." },
  png: { key: "png", label: "PNG", program: "Imagem", description: "Arquivo no formato PNG transparente." },
  cdr: { key: "cdr", label: "CDR", program: "CorelDRAW", description: "Arquivo no formato CDR editável." },
  ai: { key: "ai", label: "AI", program: "Adobe Illustrator", description: "Arquivo no formato AI editável." },
  eps: { key: "eps", label: "EPS", program: "Vetor", description: "Arquivo no formato EPS vetorial editável." },
  svg: { key: "svg", label: "SVG", program: "Vetor", description: "Arquivo no formato SVG vetorial editável." },
  pdf: { key: "pdf", label: "PDF", program: "Documento", description: "Arquivo no formato PDF em alta qualidade." },
  jpg: { key: "jpg", label: "JPG", program: "Imagem", description: "Arquivo no formato JPG em alta resolução." },
  webp: { key: "webp", label: "WEBP", program: "Imagem", description: "Arquivo no formato WEBP em alta resolução." },
  zip: { key: "zip", label: "ZIP", program: "Pacote", description: "Arquivo compactado em ZIP com os arquivos do produto." },
};

export const FORMAT_KEYS = Object.keys(FORMATS) as FormatKey[];

/** Normaliza qualquer texto de formato para uma chave conhecida (ou null). */
export function normalizeFormatKey(value?: string | null): FormatKey | null {
  const f = (value || "").trim().toLowerCase().replace(/^\./, "");
  if (!f) return null;
  if (FORMAT_KEYS.includes(f as FormatKey)) return f as FormatKey;
  if (f === "jpeg") return "jpg";
  if (f === "rar" || f === "7z") return "zip";
  if (f.includes("corel") || f.includes("cdr")) return "cdr";
  if (f.includes("photoshop") || f.includes("psd")) return "psd";
  if (f.includes("illustrator")) return "ai";
  if (f.includes("vetor") || f.includes("vector")) return "cdr";
  return null;
}

export function getFormatInfo(value?: string | null): FormatInfo | null {
  const key = normalizeFormatKey(value);
  return key ? FORMATS[key] : null;
}

/** Frase descritiva; cai para um texto genérico com o formato em caixa alta. */
export function formatDescription(value?: string | null): string | null {
  const info = getFormatInfo(value);
  if (info) return info.description;
  const raw = (value || "").trim().toLowerCase().replace(/^\./, "");
  return raw ? `Arquivo no formato ${raw.toUpperCase()}.` : null;
}

export function formatLabel(value?: string | null): string {
  const info = getFormatInfo(value);
  if (info) return info.label;
  return (value || "").trim().replace(/^\./, "").toUpperCase();
}

/** Detecta o formato a partir de textos livres (URL de download, título, tags, descrição). */
export function detectFormat(...sources: (string | null | undefined)[]): FormatKey | null {
  const hay = sources.filter(Boolean).join(" ").toLowerCase();
  if (!hay) return null;
  const byExt = hay.match(/\.(cdr|psd|ai|eps|svg|pdf|png|jpe?g|webp|zip|rar|7z)\b/);
  if (byExt) return normalizeFormatKey(byExt[1]);
  if (hay.includes("coreldraw") || hay.includes("corel draw") || hay.includes("corel")) return "cdr";
  if (hay.includes("photoshop")) return "psd";
  if (hay.includes("illustrator")) return "ai";
  if (hay.includes("transparente")) return "png";
  if (hay.includes("vetor") || hay.includes("vector")) return "cdr";
  for (const k of FORMAT_KEYS) if (new RegExp(`\\b${k}\\b`).test(hay)) return k;
  return null;
}
