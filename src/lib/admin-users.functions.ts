import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "./admin-guard.server";

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: any) =>
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
      fullName: z.string().min(1),
      role: z.enum(["admin", "user"]).default("user"),
    }).parse(data)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as any, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Create user in Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName }
    });

    if (authError) throw authError;
    if (!authUser.user) throw new Error("Falha ao criar usuário");

    // 2. Add role if needed
    if (data.role === "admin") {
      await supabaseAdmin.from("user_roles").insert({
        user_id: authUser.user.id,
        role: "admin"
      });
    }

    // 3. Update profile full_name (trigger usually does this, but being safe)
    await supabaseAdmin.from("profiles").update({
      full_name: data.fullName
    }).eq("id", authUser.user.id);

    return { id: authUser.user.id };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: any) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as any, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw error;
    return { success: true };
  });
