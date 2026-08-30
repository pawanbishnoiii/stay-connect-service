import { createFileRoute } from "@tanstack/react-router";
import { OwnerDashboard } from "@/components/owner/OwnerDashboard";

export const Route = createFileRoute("/_authenticated/owner/")({
  head: () => ({
    meta: [
      { title: "Owner Dashboard — LocalSpot" },
      { name: "description", content: "Manage your listings, bookings, customers and finances on LocalSpot." },
      { property: "og:title", content: "Owner Dashboard — LocalSpot" },
      { property: "og:description", content: "Manage your listings, bookings, customers and finances on LocalSpot." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <OwnerDashboard tab="overview" />,
});
