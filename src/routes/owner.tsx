import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/owner")({
  head: () => ({
    meta: [
      { title: "Owner dashboard — LocalSpot" },
      { name: "description", content: "Manage your listings, orders and customers" },
      { property: "og:title", content: "Owner dashboard — LocalSpot" },
      { property: "og:description", content: "Manage your listings, orders and customers" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OwnerPage,
});

function OwnerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Owner dashboard</h1>
      <p className="mt-2 text-sm text-muted-foreground">Manage your listings, orders and customers</p>
      <p className="mt-6 text-xs text-muted-foreground">This section is being built.</p>
    </div>
  );
}
