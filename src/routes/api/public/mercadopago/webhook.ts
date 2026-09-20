import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

const MP_API = "https://api.mercadopago.com";

import { trackPurchase } from "@/lib/analytics";

export const Route = createFileRoute("/api/public/mercadopago/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const bodyText = await request.text();

          let paymentId: string | null = null;
          try {
            const body = JSON.parse(bodyText);
            paymentId =
              body?.data?.id?.toString() ??
              body?.resource?.toString().split("/").pop() ??
              url.searchParams.get("data.id") ??
              url.searchParams.get("id");
          } catch {
            paymentId = url.searchParams.get("data.id") ?? url.searchParams.get("id");
          }

          if (!paymentId) return new Response("missing payment id", { status: 400 });

          const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
          const sigHeader = request.headers.get("x-signature");
          const requestId = request.headers.get("x-request-id") ?? "";
          if (!secret) {
            console.error("MP webhook rejected: MERCADO_PAGO_WEBHOOK_SECRET not configured");
            return new Response("misconfigured", { status: 401 });
          }
          if (!sigHeader) {
            return new Response("missing signature", { status: 401 });
          }
          const parts = Object.fromEntries(
            sigHeader.split(",").map((p) => {
              const [k, v] = p.trim().split("=");
              return [k, v];
            }),
          );
          const ts = parts.ts;
          const v1 = parts.v1;
          if (!ts || !v1) {
            return new Response("invalid signature", { status: 401 });
          }
          const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
          const expected = createHmac("sha256", secret).update(manifest).digest("hex");
          const a = Buffer.from(expected);
          const b = Buffer.from(v1);
          if (a.length !== b.length || !timingSafeEqual(a, b)) {
            console.warn("MP webhook signature mismatch");
            return new Response("invalid signature", { status: 401 });
          }


          const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
          if (!token) return new Response("misconfigured", { status: 500 });

          const mpRes = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!mpRes.ok) return new Response("ok", { status: 200 });
          const mp: any = await mpRes.json();

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const nextStatus: "paid" | "failed" | "refunded" | null =
            mp.status === "approved"
              ? "paid"
              : mp.status === "refunded"
                ? "refunded"
                : ["cancelled", "rejected"].includes(mp.status)
                  ? "failed"
                  : null;

          if (!nextStatus) return new Response("ok");

          const update =
            nextStatus === "paid"
              ? { status: nextStatus, paid_at: new Date().toISOString() }
              : { status: nextStatus };

          // Find order first (need id + user for cart cleanup + grant)
          const { data: orderRow } = await supabaseAdmin
            .from("orders")
            .select("id, user_id, status, items, coupon_code")
            .eq("provider", "mercadopago")
            .eq("provider_payment_id", String(paymentId))
            .maybeSingle();

          if (!orderRow) return new Response("ok");

          if (orderRow.status === "paid") return new Response("ok"); // idempotent

          const { error } = await supabaseAdmin.from("orders").update(update).eq("id", orderRow.id);
          if (error) {
            console.error("MP webhook update error:", error);
            return new Response("db error", { status: 500 });
          }

          if (nextStatus === "paid") {
            // Grant downloads for all items
            await supabaseAdmin.rpc("grant_order_downloads", { _order_id: orderRow.id });
            // Clear cart if multi-item
            if (orderRow.items) {
              await supabaseAdmin.from("cart_items").delete().eq("user_id", orderRow.user_id);
            }
            // Coupon redemption + increment counter
            if (orderRow.coupon_code) {
              const { data: coupon } = await supabaseAdmin
                .from("coupons")
                .select("id, uses_count")
                .ilike("code", orderRow.coupon_code)
                .maybeSingle();
              if (coupon) {
                await supabaseAdmin.from("coupon_redemptions").insert({
                  coupon_id: coupon.id,
                  user_id: orderRow.user_id,
                  order_id: orderRow.id,
                });
                await supabaseAdmin
                  .from("coupons")
                  .update({ uses_count: (coupon.uses_count ?? 0) + 1 })
                  .eq("id", coupon.id);
              }
            }

            const { sendOrderPaidEmail } = await import("@/lib/order-emails.server");
            await sendOrderPaidEmail(orderRow.id);

            // Track purchase server-side (for GTM/GA4 if it works with Server-Side GTM, 
            // but here we are pushing to window.dataLayer on client side usually.
            // Since this is a server function, we can't push to window.dataLayer.
            // But the request asked to maintain strictly to payment approval.
            // We'll keep the client-side trackPurchase for Pix as it happens when status changes to 'paid'.
          }

          return new Response("ok");

        } catch (e) {
          console.error("MP webhook error:", e);
          return new Response("error", { status: 500 });
        }
      },
      GET: async () => new Response("ok"),
    },
  },
});
