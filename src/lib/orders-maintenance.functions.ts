import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "./admin-guard.server";

export const cleanupExpiredOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as any, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({ status: "failed" })
      .eq("status", "pending")
      .lt("pix_expires_at", new Date().toISOString())
      .select("id");
    if (error) throw new Error("Falha ao limpar pedidos");
    return { count: data?.length ?? 0 };
  });
