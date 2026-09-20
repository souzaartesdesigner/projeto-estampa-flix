import { createFileRoute } from "@tanstack/react-router";

function isAuthorized(request: Request) {
  const secret = process.env["CRON_SECRET"];
  if (!secret) return false;
  const provided =
    request.headers.get("x-cron-secret") ??
    (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  return provided.length === secret.length && provided === secret;
}

export const Route = createFileRoute("/api/public/orders/cleanup-expired")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isAuthorized(request)) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const now = new Date().toISOString();

        const { data, error } = await supabaseAdmin
          .from("orders")
          .update({ status: "failed" })
          .eq("status", "pending")
          .lt("pix_expires_at", now)
          .select("id");


        if (error) {
          console.error("Cleanup error:", error);
          return new Response(JSON.stringify({ error: "cleanup_failed" }), { status: 500 });
        }

        return new Response(JSON.stringify({ count: data?.length || 0 }), {
          headers: { "Content-Type": "application/json" }
        });
      },
      GET: async () => new Response("Use POST for cleanup"),
    },
  },
});
