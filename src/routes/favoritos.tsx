import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Meus favoritos — Estampa Flix" },
      { name: "description", content: "Veja as artes digitais que você salvou como favoritas na Estampa Flix." },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/minha-conta", search: { tab: "favorites" } as any });
  },
  component: () => null,
});
