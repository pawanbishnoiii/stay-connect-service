import { createFileRoute } from "@tanstack/react-router";
import { OwnerDashboard } from "@/components/owner/OwnerDashboard";

export const Route = createFileRoute("/_authenticated/owner/listings")({
  head: () => ({
    meta: [
      { title: "Manage Listings — LocalSpot Owner" },
      { name: "description", content: "Create, edit and publish your places and services on LocalSpot." },
      { property: "og:title", content: "Manage Listings — LocalSpot Owner" },
      { property: "og:description", content: "Create, edit and publish your places and services on LocalSpot." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <OwnerDashboard tab="listings" />,
});
