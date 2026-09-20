import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "./admin-guard.server";

/** Admin-only: obtém o link externo protegido de uma arte. */
export const adminGetArtworkExternalUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ artworkId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as any, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: url, error } = await supabaseAdmin.rpc("admin_get_artwork_external_url", {
      _artwork_id: data.artworkId,
    });
    if (error) throw new Error("Falha ao obter o link externo");
    return { url: (url as string | null) ?? null };
  });

/** Admin-only: obtém o caminho do arquivo protegido de uma arte. */
export const adminGetArtworkFilePath = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ artworkId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as any, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: path, error } = await supabaseAdmin.rpc("admin_get_artwork_file_path", {
      _artwork_id: data.artworkId,
    });
    if (error) throw new Error("Falha ao obter o arquivo da arte");
    return { path: (path as string | null) ?? null };
  });

/** Admin-only: libera os downloads de um pedido pago. */
export const adminGrantOrderDownloads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ orderId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase as any, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("grant_order_downloads", { _order_id: data.orderId });
    if (error) throw new Error("Falha ao liberar os downloads do pedido");
    return { ok: true };
  });
