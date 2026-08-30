import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — LocalSpot" },
      { name: "description", content: "Offers, booking updates and nearby alerts" },
      { property: "og:title", content: "Notifications — LocalSpot" },
      { property: "og:description", content: "Offers, booking updates and nearby alerts" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
      <p className="mt-2 text-sm text-muted-foreground">Offers, booking updates and nearby alerts</p>
      <p className="mt-6 text-xs text-muted-foreground">This section is being built.</p>
    </div>
  );
}
