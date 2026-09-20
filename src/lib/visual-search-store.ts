export type VisualSearchResult = {
  id: string;
  slug: string;
  title: string;
  preview_url: string;
  price_cents: number;
  license_type?: string | null;
  is_featured?: boolean;
  is_trending?: boolean;
  download_count?: number | null;
  file_format?: string | null;
  similarity: number;
};

export type VisualSearchPayload = {
  results: VisualSearchResult[];
  exact: boolean;
  preview: string;
  at: number;
};

const KEY = "estampaflix:visual-search";

export const VISUAL_SEARCH_EVENT = "estampaflix:visual-search-updated";

export function saveVisualSearch(payload: VisualSearchPayload) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent(VISUAL_SEARCH_EVENT));
  } catch {
    /* ignore */
  }
}

export function readVisualSearch(): VisualSearchPayload | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as VisualSearchPayload) : null;
  } catch {
    return null;
  }
}

export function clearVisualSearch() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Redimensiona e comprime a imagem no navegador antes de enviar. */
export async function fileToDataUrl(file: File, maxSize = 1024): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", 0.85);
}
