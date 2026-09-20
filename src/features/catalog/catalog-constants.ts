import { z } from "zod";
import { FORMAT_KEYS, normalizeFormatKey } from "@/features/artwork/formats";

export const catalogSearchSchema = z.object({
  q: z.string().optional(),
  categoria: z.string().optional(),
  formato: z.string().optional(),
  cor: z.string().optional(),
  licenca: z.enum(["free", "premium"]).optional(),
  page: z.coerce.number().optional().catch(1),
});

export const LICENSES = [
  { value: "free", label: "Gratuitas (Free)" },
  { value: "premium", label: "Premium" },
] as const;

export type CatalogSearch = z.infer<typeof catalogSearchSchema>;

/** Sugestões iniciais — a lista real é montada com os formatos cadastrados nos produtos. */
export const FORMAT_SUGGESTIONS = FORMAT_KEYS as unknown as string[];

/** Normaliza o formato digitado (mapeia para uma chave conhecida quando possível). */
export function normalizeFormat(value: string) {
  return normalizeFormatKey(value) ?? (value || "").trim().toLowerCase().replace(/^\./, "");
}

export const COLORS = [
  { key: "color.black", value: "black" },
  { key: "color.white", value: "white" },
  { key: "color.red", value: "red" },
  { key: "color.blue", value: "blue" },
  { key: "color.green", value: "green" },
  { key: "color.yellow", value: "yellow" },
  { key: "color.pink", value: "pink" },
  { key: "color.purple", value: "purple" },
] as const;
