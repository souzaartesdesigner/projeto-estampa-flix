import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { transferImageToStorage } from "./artwork-upload.server";
import { assertAdmin, assertSafeExternalImageUrl } from "./admin-guard.server";

export const processExternalImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({
    url: z.string().url(),
    folder: z.string().optional()
  }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as any, context.userId);
    assertSafeExternalImageUrl(data.url);
    return await transferImageToStorage(data.url, "product-images", data.folder || "imported");
  });
