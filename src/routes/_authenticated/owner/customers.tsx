import { createFileRoute } from "@tanstack/react-router";
import { OwnerDashboard } from "@/components/owner/OwnerDashboard";

export const Route = createFileRoute("/_authenticated/owner/customers")({
  head: () => ({
    meta: [
      { title: "Customers — LocalSpot Owner" },
      { name: "description", content: "Manage your members, tenants and subscribers with renewals and dues." },
      { property: "og:title", content: "Customers — LocalSpot Owner" },
      { property: "og:description", content: "Manage your members, tenants and subscribers with renewals and dues." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <OwnerDashboard tab="customers" />,
});
