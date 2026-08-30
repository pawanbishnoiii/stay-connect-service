import { createFileRoute } from "@tanstack/react-router";
import { OwnerDashboard } from "@/components/owner/OwnerDashboard";

export const Route = createFileRoute("/_authenticated/owner/finance")({
  head: () => ({
    meta: [
      { title: "Finance & Ledger — LocalSpot Owner" },
      { name: "description", content: "Record income, expenses and dues with a simple business ledger." },
      { property: "og:title", content: "Finance & Ledger — LocalSpot Owner" },
      { property: "og:description", content: "Record income, expenses and dues with a simple business ledger." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <OwnerDashboard tab="finance" />,
});
