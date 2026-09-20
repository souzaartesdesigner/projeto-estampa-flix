import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "./admin-guard.server";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** Busca pública: recebe uma imagem (data URL) e devolve as artes mais parecidas. */
export const searchArtworksByImage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        dataUrl: z
          .string()
          .regex(/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/, "Formato de imagem inválido"),
        limit: z.number().int().min(1).max(48).optional(),
        minSimilarity: z.number().min(0).max(1).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const base64 = data.dataUrl.split(",")[1] ?? "";
    if ((base64.length * 3) / 4 > MAX_IMAGE_BYTES) {
      throw new Error("Imagem muito grande (máx. 4 MB).");
    }

    const { embedImage } = await import("./embeddings.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const embedding = await embedImage({ dataUrl: data.dataUrl });

    const { data: matches, error } = await (supabaseAdmin as any).rpc("match_artworks_by_image", {
      query_embedding: JSON.stringify(embedding),
      match_count: data.limit ?? 24,
      min_similarity: data.minSimilarity ?? 0.35,
    });
    if (error) throw new Error("Falha ao buscar artes semelhantes.");

    const results = (matches ?? []) as Array<{ id: string; similarity: number }>;
    const exact = results.length > 0 && results[0].similarity >= 0.92;

    return { results, exact };
  });

/** Admin: indexa as artes que ainda não têm impressão visual. */
export const backfillArtworkEmbeddings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ batchSize: z.number().int().min(1).max(25).optional() }).parse(data))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as any, context.userId);

    const { embedImage, EMBEDDING_MODEL } = await import("./embeddings.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const batchSize = data.batchSize ?? 10;

    const { data: pending, error } = await (supabaseAdmin as any).rpc("artworks_missing_embeddings", {
      _limit: batchSize,
    });
    if (error) throw new Error("Falha ao listar artes pendentes.");

    let indexed = 0;
    const failures: string[] = [];

    for (const row of (pending ?? []) as Array<{ id: string; preview_url: string }>) {
      try {
        const embedding = await embedImage({ url: row.preview_url });
        const { error: upErr } = await (supabaseAdmin as any).from("artwork_embeddings").upsert({
          artwork_id: row.id,
          embedding: JSON.stringify(embedding),
          model: EMBEDDING_MODEL,
          updated_at: new Date().toISOString(),
        });
        if (upErr) throw upErr;
        indexed++;
      } catch (e: any) {
        failures.push(`${row.id}: ${e?.message ?? "erro"}`);
      }
    }

    const { count: remaining } = await (supabaseAdmin as any)
      .from("artworks")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true);

    const { count: done } = await (supabaseAdmin as any)
      .from("artwork_embeddings")
      .select("artwork_id", { count: "exact", head: true });

    return { indexed, failures, total: remaining ?? 0, done: done ?? 0 };
  });
