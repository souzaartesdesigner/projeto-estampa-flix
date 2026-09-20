import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const MP_API = "https://api.mercadopago.com";

function getAccessToken() {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");
  return token;
}

async function callMpCreatePayment(payload: any) {
  const idempotencyKey = crypto.randomUUID();
  const res = await fetch(`${MP_API}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const t = await res.text();
    console.error("MP create payment failed:", res.status, t);
    throw new Error("mp_create_failed");
  }
  return res.json();
}

export const createPixOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { artworkId?: string; cartCheckout?: boolean; couponCode?: string | null }) =>
    z
      .object({
        artworkId: z.string().uuid().optional(),
        cartCheckout: z.boolean().optional(),
        couponCode: z.string().trim().min(1).max(64).optional().nullable(),
      })
      .refine((v) => v.artworkId || v.cartCheckout, { message: "artworkId ou cartCheckout" })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Build items list
    type Item = { artwork_id: string; title: string; price_cents: number; slug: string };
    let items: Item[] = [];
    let description = "";

    if (data.cartCheckout) {
      const { data: cart, error } = await supabase
        .from("cart_items")
        .select("artwork_id, artworks(id,slug,title,price_cents,is_published)");
      if (error) throw new Error(error.message);
      const rows = (cart ?? []) as any[];
      items = rows
        .filter((r) => r.artworks?.is_published && (r.artworks?.price_cents ?? 0) > 0)
        .map((r) => ({
          artwork_id: r.artworks.id,
          title: r.artworks.title,
          price_cents: r.artworks.price_cents,
          slug: r.artworks.slug,
        }));
      if (items.length === 0) throw new Error("empty_cart");
      description = items.length === 1 ? items[0].title : `${items.length} artes Estampa Flix`;
    } else {
      const { data: art } = await supabase
        .from("artworks")
        .select("id,slug,title,price_cents,is_published")
        .eq("id", data.artworkId!)
        .eq("is_published", true)
        .maybeSingle();
      if (!art) throw new Error("artwork_not_found");
      if (!art.price_cents || art.price_cents <= 0) throw new Error("invalid_price");
      items = [{ artwork_id: art.id, title: art.title, price_cents: art.price_cents, slug: art.slug }];
      description = art.title;
    }

    const subtotal = items.reduce((s, i) => s + i.price_cents, 0);

    // Apply coupon (Pix scope)
    let discountCents = 0;
    let couponCode: string | null = null;
    if (data.couponCode) {
      const { data: cval, error: cerr } = await supabase.rpc("validate_coupon", {
        _code: data.couponCode,
        _scope: "pix",
        _subtotal_cents: subtotal,
      });
      if (cerr) throw new Error(cerr.message);
      const row: any = Array.isArray(cval) ? cval[0] : cval;
      if (!row?.valid) throw new Error(`coupon_${row?.message ?? "invalid"}`);
      discountCents = row.discount_cents ?? 0;
      couponCode = data.couponCode;
    }

    const totalCents = Math.max(0, subtotal - discountCents);
    if (totalCents <= 0) throw new Error("total_zero");

    // Payer
    const { data: profile } = await supabase
      .from("profiles")
      .select("email,full_name")
      .eq("id", userId)
      .maybeSingle();
    const payerEmail = profile?.email || `${userId}@estampahub.local`;

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const amount = Number((totalCents / 100).toFixed(2));

    const mp: any = await callMpCreatePayment({
      transaction_amount: amount,
      description,
      payment_method_id: "pix",
      date_of_expiration: expiresAt.toISOString().replace("Z", "-00:00"),
      payer: { email: payerEmail, first_name: profile?.full_name?.split(" ")[0] || "Cliente" },
      metadata: { user_id: userId, item_count: items.length },
    });

    const qrCode = mp.point_of_interaction?.transaction_data?.qr_code as string | undefined;
    const qrCodeBase64 = mp.point_of_interaction?.transaction_data?.qr_code_base64 as string | undefined;
    if (!qrCode) throw new Error("mp_no_qr_code");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const isMulti = items.length > 1 || !!data.cartCheckout;
    const { data: order, error: ordErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        artwork_id: isMulti ? null : items[0].artwork_id,
        items: isMulti ? items : null,
        amount_cents: totalCents,
        discount_cents: discountCents,
        coupon_code: couponCode,
        status: "pending",
        provider: "mercadopago",
        provider_payment_id: String(mp.id),
        pix_qr_code: qrCode,
        pix_qr_code_base64: qrCodeBase64,
        pix_expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();
    if (ordErr) throw new Error(ordErr.message);

    const { sendOrderCreatedEmail } = await import("@/lib/order-emails.server");
    await sendOrderCreatedEmail(order.id);

    return {

      orderId: order.id,
      qrCode,
      qrCodeBase64,
      expiresAt: expiresAt.toISOString(),
      amountCents: totalCents,
      subtotalCents: subtotal,
      discountCents,
      itemCount: items.length,
    };
  });

export const checkPixOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { orderId: string }) =>
    z.object({ orderId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        "id,status,provider,provider_payment_id,pix_qr_code,pix_qr_code_base64,pix_expires_at,amount_cents,discount_cents,coupon_code,items,artwork_id,artworks(slug,title)",
      )
      .eq("id", data.orderId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("order_not_found");

    if (order.status === "pending" && order.provider_payment_id) {
      try {
        const mpRes = await fetch(`${MP_API}/v1/payments/${order.provider_payment_id}`, {
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        });
        if (mpRes.ok) {
          const mp: any = await mpRes.json();
          if (mp.status === "approved") {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            await supabaseAdmin
              .from("orders")
              .update({ status: "paid", paid_at: new Date().toISOString() })
              .eq("id", order.id)
              .eq("status", "pending");
            // Grant downloads + clear cart for multi-item
            await supabaseAdmin.rpc("grant_order_downloads", { _order_id: order.id });
            if (order.items) {
              await supabaseAdmin.from("cart_items").delete().eq("user_id", userId);
            }
            const { sendOrderPaidEmail } = await import("@/lib/order-emails.server");
            await sendOrderPaidEmail(order.id);
            return { ...order, status: "paid" as const };

          }
          if (["cancelled", "rejected", "refunded"].includes(mp.status)) {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            await supabaseAdmin
              .from("orders")
              .update({ status: "failed" })
              .eq("id", order.id)
              .eq("status", "pending");
            return { ...order, status: "failed" as const };
          }
        }
      } catch (e) {
        console.error("MP poll error:", e);
      }
    }

    return order;
  });

export const validateCouponFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { code: string; scope: "pix" | "subscription"; subtotalCents: number }) =>
    z
      .object({
        code: z.string().trim().min(1).max(64),
        scope: z.enum(["pix", "subscription"]),
        subtotalCents: z.number().int().nonnegative(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: res, error } = await supabase.rpc("validate_coupon", {
      _code: data.code,
      _scope: data.scope,
      _subtotal_cents: data.subtotalCents,
    });
    if (error) throw new Error(error.message);
    const row: any = Array.isArray(res) ? res[0] : res;
    return {
      valid: !!row?.valid,
      discountCents: row?.discount_cents ?? 0,
      message: row?.message ?? "",
    };
  });
