import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved — LocalSpot" },
      { name: "description", content: "Listings you saved on LocalSpot" },
      { property: "og:title", content: "Saved — LocalSpot" },
      { property: "og:description", content: "Listings you saved on LocalSpot" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Saved</h1>
      <p className="mt-2 text-sm text-muted-foreground">Listings you saved on LocalSpot</p>
      <p className="mt-6 text-xs text-muted-foreground">This section is being built.</p>
    </div>
  );
}
