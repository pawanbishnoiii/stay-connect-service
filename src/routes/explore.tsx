import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "Explore — LocalSpot" },
      { name: "description", content: "Explore nearby libraries, PGs, tiffin and services" },
      { property: "og:title", content: "Explore — LocalSpot" },
      { property: "og:description", content: "Explore nearby libraries, PGs, tiffin and services" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExplorePage,
});

function ExplorePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Explore</h1>
      <p className="mt-2 text-sm text-muted-foreground">Explore nearby libraries, PGs, tiffin and services</p>
      <p className="mt-6 text-xs text-muted-foreground">This section is being built.</p>
    </div>
  );
}
