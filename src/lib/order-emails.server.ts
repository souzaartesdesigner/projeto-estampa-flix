import { sendTemplateEmail } from "@/lib/email-templates/send-email";

const SITE_URL = "https://estampaflix.com";

const shortOrder = (id: string) => `#${id.slice(0, 8).toUpperCase()}`;

type OrderRow = {
  id: string;
  user_id: string;
  amount_cents: number | null;
  discount_cents: number | null;
  artwork_id: string | null;
  items: any;
};

async function loadOrderContext(orderId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id,user_id,amount_cents,discount_cents,artwork_id,items")
    .eq("id", orderId)
    .maybeSingle<OrderRow>();
  if (!order) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email,full_name")
    .eq("id", order.user_id)
    .maybeSingle();

  const email = profile?.email as string | undefined;
  if (!email || email.endsWith(".local")) return null;

  let items: Array<{ title: string; price_cents: number; slug: string }> = [];
  if (Array.isArray(order.items) && order.items.length > 0) {
    items = order.items.map((i: any) => ({
      title: i?.title ?? "Arte digital",
      price_cents: i?.price_cents ?? 0,
      slug: i?.slug ?? "",
    }));
  } else if (order.artwork_id) {
    const { data: art } = await supabaseAdmin
      .from("artworks")
      .select("title,slug,price_cents")
      .eq("id", order.artwork_id)
      .maybeSingle();
    if (art) {
      items = [
        { title: art.title, price_cents: art.price_cents ?? 0, slug: art.slug },
      ];
    }
  }

  return {
    order,
    email,
    firstName: (profile?.full_name as string | undefined)?.split(" ")[0],
    items,
  };
}

/** Sends the "order created / awaiting Pix payment" email. Never throws. */
export async function sendOrderCreatedEmail(orderId: string) {
  try {
    const ctx = await loadOrderContext(orderId);
    if (!ctx) return;

    await sendTemplateEmail("order-confirmation", ctx.email, {
      idempotencyKey: `order-confirmation-${orderId}`,
      templateData: {
        customerName: ctx.firstName,
        orderNumber: shortOrder(orderId),
        items: ctx.items.map((i) => ({ title: i.title, price_cents: i.price_cents })),
        totalCents: ctx.order.amount_cents ?? 0,
        discountCents: ctx.order.discount_cents ?? 0,
        paymentUrl: `${SITE_URL}/pagamento/pix/${orderId}`,
        expiresAt: "30 minutos",
      },
    });
  } catch (e) {
    console.error("[order-emails] falha ao enviar confirmação de pedido:", e);
  }
}

/** Sends the "payment approved / download ready" email. Never throws. */
export async function sendOrderPaidEmail(orderId: string) {
  try {
    const ctx = await loadOrderContext(orderId);
    if (!ctx) return;

    await sendTemplateEmail("payment-approved", ctx.email, {
      idempotencyKey: `payment-approved-${orderId}`,
      templateData: {
        customerName: ctx.firstName,
        orderNumber: shortOrder(orderId),
        totalCents: ctx.order.amount_cents ?? 0,
        items: ctx.items.map((i) => ({
          title: i.title,
          url: i.slug ? `${SITE_URL}/artes/${i.slug}` : undefined,
        })),
        accountUrl: `${SITE_URL}/minha-conta`,
      },
    });
  } catch (e) {
    console.error("[order-emails] falha ao enviar pagamento aprovado:", e);
  }
}
