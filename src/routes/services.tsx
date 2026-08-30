import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — LocalSpot" },
      { name: "description", content: "Browse every LocalSpot category of student services" },
      { property: "og:title", content: "Services — LocalSpot" },
      { property: "og:description", content: "Browse every LocalSpot category of student services" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Services</h1>
      <p className="mt-2 text-sm text-muted-foreground">Browse every LocalSpot category of student services</p>
      <p className="mt-6 text-xs text-muted-foreground">This section is being built.</p>
    </div>
  );
}
