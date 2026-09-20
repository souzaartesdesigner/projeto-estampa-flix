import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function getOrigin(): string {
  const origin = getRequestHeader("origin") ?? getRequestHeader("referer");
  if (origin) return new URL(origin).origin;
  return process.env.PUBLIC_APP_URL ?? "http://localhost:8080";
}

async function ensureStripeCustomer(supabase: any, userId: string, email: string | undefined) {
  const { getStripe } = await import("./stripe.server");
  const stripe = getStripe();

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, email, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.stripe_customer_id) return profile.stripe_customer_id as string;

  const customer = await stripe.customers.create({
    email: email ?? profile?.email ?? undefined,
    name: profile?.full_name ?? undefined,
    metadata: { user_id: userId },
  });

  await supabase.from("profiles").update({ stripe_customer_id: customer.id }).eq("id", userId);
  return customer.id;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ planId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { getStripe } = await import("./stripe.server");
    const stripe = getStripe();
    const { supabase, userId, claims } = context;

    const { data: plan, error } = await supabase
      .from("plans")
      .select("id, name, stripe_price_id, is_active")
      .eq("id", data.planId)
      .maybeSingle();
    if (error || !plan) throw new Error("Plano não encontrado");
    if (!plan.is_active) throw new Error("Plano indisponível");
    if (!plan.stripe_price_id) throw new Error("Plano não está vinculado ao Stripe");

    const email = (claims as any)?.email as string | undefined;
    const customerId = await ensureStripeCustomer(supabase, userId, email);
    const origin = getOrigin();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      success_url: `${origin}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/planos`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { user_id: userId, plan_id: plan.id },
      },
      metadata: { user_id: userId, plan_id: plan.id, kind: "subscription" },
    });

    return { url: session.url };
  });

export const createBillingPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getStripe } = await import("./stripe.server");
    const stripe = getStripe();
    const { supabase, userId, claims } = context;
    const email = (claims as any)?.email as string | undefined;
    const customerId = await ensureStripeCustomer(supabase, userId, email);
    const origin = getOrigin();

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/minha-conta`,
    });
    return { url: session.url };
  });
