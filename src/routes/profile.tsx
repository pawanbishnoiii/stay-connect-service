import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — LocalSpot" },
      { name: "description", content: "Your LocalSpot account, bookings and preferences" },
      { property: "og:title", content: "Profile — LocalSpot" },
      { property: "og:description", content: "Your LocalSpot account, bookings and preferences" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
      <p className="mt-2 text-sm text-muted-foreground">Your LocalSpot account, bookings and preferences</p>
      <p className="mt-6 text-xs text-muted-foreground">This section is being built.</p>
    </div>
  );
}
