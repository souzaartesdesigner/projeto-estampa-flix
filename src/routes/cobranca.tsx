import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/cobranca")({
  head: () => ({
    meta: [
      { title: "Cobrança e assinatura — Estampa Flix" },
      { name: "description", content: "Gerencie seu plano, créditos e informações de cobrança da sua conta Estampa Flix." },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/minha-conta", search: { tab: "subscription" } as any });
  },
  component: () => null,
});
