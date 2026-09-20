import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/downloads")({
  head: () => ({
    meta: [
      { title: "Meus downloads — Estampa Flix" },
      { name: "description", content: "Acesse o histórico das artes digitais que você já baixou na Estampa Flix." },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/minha-conta", search: { tab: "downloads" } as any });
  },
  component: () => null,
});
