import { createFileRoute } from "@tanstack/react-router";
import { OwnerDashboard } from "@/components/owner/OwnerDashboard";

export const Route = createFileRoute("/_authenticated/owner/bookings")({
  head: () => ({
    meta: [
      { title: "Bookings & Orders — LocalSpot Owner" },
      { name: "description", content: "Track bookings, orders and visit requests from your customers." },
      { property: "og:title", content: "Bookings & Orders — LocalSpot Owner" },
      { property: "og:description", content: "Track bookings, orders and visit requests from your customers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <OwnerDashboard tab="bookings" />,
});
