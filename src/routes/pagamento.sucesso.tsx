import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { trackPurchase } from "@/lib/analytics";

export const Route = createFileRoute("/pagamento/sucesso")({
  validateSearch: (search: Record<string, unknown>) => ({
    session_id: search.session_id as string | undefined,
  }),
  head: () => ({ meta: [{ title: "Pagamento confirmado — Estampa Flix" }, { name: "robots", content: "noindex" }] }),
  component: Sucesso,
});

function Sucesso() {
  const { session_id } = Route.useSearch() as { session_id?: string };
  const [tracked, setTracked] = useState(false);

  const { data: sub, isLoading } = useQuery({
    queryKey: ["checkout-success", session_id],
    enabled: !!session_id,
    queryFn: async () => {
      // Small delay to ensure webhook processed
      await new Promise(r => setTimeout(r, 2000));
      
      const { data: userSub } = await supabase
        .from("subscriptions")
        .select("*, plans(*)")
        .eq("status", "active")
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      return userSub;
    }
  });

  useEffect(() => {
    if (sub && !tracked) {
      trackPurchase(sub.id, [{
        item_id: sub.plans.id,
        item_name: sub.plans.name,
        price: sub.plans.price_cents / 100,
        quantity: 1
      }], sub.plans.price_cents);
      setTracked(true);
    }
  }, [sub, tracked]);

  return (
    <SiteLayout>
      <section className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
        {isLoading ? (
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        ) : (
          <CheckCircle2 className="h-16 w-16 text-success" />
        )}
        <h1 className="mt-4 font-display text-3xl font-black md:text-4xl">Assinatura confirmada!</h1>
        <p className="mt-3 text-muted-foreground">
          Seus créditos já estão disponíveis. Pode começar a baixar suas artes agora mesmo.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild className="bg-gradient-brand text-brand-foreground shadow-brand hover:opacity-90">
            <Link to="/catalogo" search={{ page: 1 }}>Explorar catálogo</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/minha-conta" search={{ tab: "profile" }}>Minha conta</Link>
          </Button>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Se os créditos não aparecerem em alguns segundos, atualize a página.
        </p>
      </section>
    </SiteLayout>
  );
}
