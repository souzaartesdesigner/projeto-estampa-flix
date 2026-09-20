import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Souza Artes" },
      {
        name: "description",
        content: "Souza Artes",
      },
      { property: "og:title", content: "Souza Artes" },
      { property: "og:description", content: "Souza Artes" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return <div className="min-h-screen bg-white" />;
}
