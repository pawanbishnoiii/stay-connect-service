import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Map — LocalSpot" },
      { name: "description", content: "Find student services around you on the map" },
      { property: "og:title", content: "Map — LocalSpot" },
      { property: "og:description", content: "Find student services around you on the map" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Map</h1>
      <p className="mt-2 text-sm text-muted-foreground">Find student services around you on the map</p>
      <p className="mt-6 text-xs text-muted-foreground">This section is being built.</p>
    </div>
  );
}
