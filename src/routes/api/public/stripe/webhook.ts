import { createFileRoute } from "@tanstack/react-router";

// Purchase tracking for subscriptions is usually handled client-side after successful redirect 
// or server-side if using Server-Side GTM. In this project we use window.dataLayer.
// The purchase event will be triggered on the success page after Stripe redirect.

export const Route = createFileRoute("/api/public/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { getStripe } = await import("@/lib/stripe.server");
        const stripe = getStripe();

        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secret) {
          console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET não configurado");
          return new Response("Webhook secret not configured", { status: 500 });
        }

        const signature = request.headers.get("stripe-signature");
        if (!signature) return new Response("Missing signature", { status: 400 });

        const body = await request.text();
        let event;
        try {
          event = await stripe.webhooks.constructEventAsync(body, signature, secret);
        } catch (err) {
          console.error("[stripe-webhook] Signature verification failed", err);
          return new Response("Invalid signature", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        type SubStatus = "active" | "canceled" | "past_due" | "trialing";
        const mapStatus = (s: string): SubStatus => {
          if (s === "active" || s === "trialing") return "active";
          if (s === "past_due") return "past_due";
          if (s === "canceled" || s === "incomplete_expired" || s === "unpaid" || s === "paused") return "canceled";
          return "canceled";
        };

        try {
          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object as any;
              if (session.mode !== "subscription") break;
              const userId = session.metadata?.user_id as string | undefined;
              const planId = session.metadata?.plan_id as string | undefined;
              if (!userId || !planId) {
                console.warn("[stripe-webhook] checkout.session.completed sem metadata", session.id);
                break;
              }

              const subscriptionId = session.subscription as string;
              const sub = await stripe.subscriptions.retrieve(subscriptionId);

              const { data: plan } = await supabaseAdmin
                .from("plans")
                .select("monthly_credits")
                .eq("id", planId)
                .maybeSingle();
              const credits = plan?.monthly_credits ?? 0;

              await supabaseAdmin.from("subscriptions").upsert(
                {
                  user_id: userId,
                  plan_id: planId,
                  stripe_subscription_id: subscriptionId,
                  status: mapStatus(sub.status),
                  credits_remaining: credits,
                  current_period_start: new Date((sub as any).current_period_start * 1000).toISOString(),
                  current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
                  cancel_at_period_end: (sub as any).cancel_at_period_end ?? false,
                },
                { onConflict: "stripe_subscription_id" },
              );
              break;
            }

            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
              const sub = event.data.object as any;
              const status: SubStatus = event.type === "customer.subscription.deleted"
                ? "canceled"
                : mapStatus(sub.status);

              await supabaseAdmin
                .from("subscriptions")
                .update({
                  status,
                  current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
                  current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
                  cancel_at_period_end: sub.cancel_at_period_end ?? false,
                })
                .eq("stripe_subscription_id", sub.id);
              break;
            }

            case "invoice.paid": {
              // Renovação mensal — reseta créditos
              const invoice = event.data.object as any;
              const subscriptionId = invoice.subscription as string | null;
              if (!subscriptionId) break;
              if (invoice.billing_reason !== "subscription_cycle") break;

              const { data: subRow } = await supabaseAdmin
                .from("subscriptions")
                .select("plan_id")
                .eq("stripe_subscription_id", subscriptionId)
                .maybeSingle();
              if (!subRow) break;

              const { data: plan } = await supabaseAdmin
                .from("plans")
                .select("monthly_credits")
                .eq("id", subRow.plan_id)
                .maybeSingle();
              if (!plan) break;

              await supabaseAdmin
                .from("subscriptions")
                .update({ credits_remaining: plan.monthly_credits, status: "active" })
                .eq("stripe_subscription_id", subscriptionId);
              break;
            }

            case "invoice.payment_failed": {
              const invoice = event.data.object as any;
              const subscriptionId = invoice.subscription as string | null;
              if (!subscriptionId) break;
              await supabaseAdmin
                .from("subscriptions")
                .update({ status: "past_due" })
                .eq("stripe_subscription_id", subscriptionId);
              break;
            }

            default:
              break;
          }
        } catch (err) {
          console.error(`[stripe-webhook] Erro ao processar ${event.type}`, err);
          return new Response("Handler error", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
