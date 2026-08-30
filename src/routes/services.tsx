import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchListings } from "@/lib/listings";
import { useUserLocation } from "@/hooks/useLocation";
import { CATEGORY_META } from "@/lib/categories";
import { CATEGORY_ICON } from "@/lib/icons";
import { AppIcon } from "@/components/AppIcon";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "All Categories — Stays, Study & Home Services | LocalSpot" },
      {
        name: "description",
        content:
          "Browse every LocalSpot category: libraries, gyms, PGs, hostels, rooms, tiffin, laundry, electricians and cleaning.",
      },
      { property: "og:title", content: "All Categories — LocalSpot" },
      {
        property: "og:description",
        content: "Every local category in one place — stays, study spaces and home services.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { point } = useUserLocation();
  const { data } = useQuery({
    queryKey: ["services-counts", point.lat, point.lng],
    queryFn: () => fetchListings({ sort: "distance" }, point, 200),
  });

  const counts = new Map<string, number>();
  for (const l of data ?? []) {
    if (!l.category_slug) continue;
    counts.set(l.category_slug, (counts.get(l.category_slug) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-5">
      <h1 className="text-xl font-bold tracking-tight">All Categories</h1>
      <p className="text-sm text-muted-foreground">Everything you need, near you</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORY_META.map((c) => (
          <Link
            key={c.slug}
            to="/explore"
            search={{ category: c.slug }}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 transition-shadow hover:shadow-md"
          >
            <AppIcon
              name={CATEGORY_ICON[c.slug] ?? "library"}
              className="h-11 w-11 transition-transform group-hover:scale-110"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{c.name}</span>
              <span className="block text-xs text-muted-foreground">
                {counts.get(c.slug) ?? 0} nearby
              </span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-base font-bold">Are you an owner or service provider?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          List your property or service free and get customers directly — no commission.
        </p>
        <Link
          to="/owner"
          className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Start listing
        </Link>
      </div>
    </div>
  );
}
