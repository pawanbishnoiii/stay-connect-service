import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPin, Clock, Star, Tag, ShieldCheck, Headphones, Users } from "lucide-react";
import { fetchListings } from "@/lib/listings";
import { useUserLocation } from "@/hooks/useLocation";
import { ListingCard, ListingCardSkeleton } from "@/components/listing/ListingCard";
import { CATEGORY_META } from "@/lib/categories";
import { AppIcon } from "@/components/AppIcon";
import { CATEGORY_ICON } from "@/lib/icons";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LocalSpot — Find the Best Places & Services Around You" },
      {
        name: "description",
        content:
          "Discover verified libraries, gyms, PGs, hostels, rooms, tiffin, laundry and home services near you in seconds.",
      },
      { property: "og:title", content: "LocalSpot — Places & Services Around You" },
      {
        property: "og:description",
        content: "Verified local places and services for students, sorted by distance from you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const QUICK = [
  { label: "Near You", sub: "Within 2 km", icon: MapPin, tint: "bg-violet-100 text-violet-600", to: "/explore" as const },
  { label: "Open Now", sub: "Open places", icon: Clock, tint: "bg-emerald-100 text-emerald-600", to: "/explore" as const },
  { label: "Top Rated", sub: "4.0+ rating", icon: Star, tint: "bg-amber-100 text-amber-600", to: "/explore" as const },
  { label: "Best Price", sub: "Great deals", icon: Tag, tint: "bg-rose-100 text-rose-600", to: "/explore" as const },
];

const TRUST = [
  { icon: ShieldCheck, title: "Verified Owners", sub: "Background verified" },
  { icon: Star, title: "Real Reviews", sub: "From real customers" },
  { icon: Users, title: "Real Community", sub: "Students & owners" },
  { icon: Headphones, title: "24/7 Support", sub: "We're here to help" },
];

function HomePage() {
  const { point, label } = useUserLocation();
  const navigate = useNavigate();

  const nearby = useQuery({
    queryKey: ["home-nearby", point.lat, point.lng],
    queryFn: () => fetchListings({ sort: "distance" }, point, 12),
  });
  const featured = useQuery({
    queryKey: ["home-featured", point.lat, point.lng],
    queryFn: () => fetchListings({ sort: "rating" }, point, 8),
  });

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-5">
      {/* Hero */}
      <section className="brand-gradient relative overflow-hidden rounded-3xl px-6 py-8 text-primary-foreground sm:px-10 sm:py-12">
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Star className="h-3.5 w-3.5" /> Everything you need, near you
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            Find the Best Places &amp; Services Around You
          </h1>
          <p className="mt-3 text-sm/relaxed opacity-90 sm:text-base">
            Top rated libraries, gyms, PGs, tiffin and home services near {label}. Verified owners,
            real reviews, direct chat — no commission.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void navigate({ to: "/explore" })}
              className="inline-flex items-center gap-2 rounded-full bg-background px-5 py-3 text-sm font-semibold text-foreground shadow-sm"
            >
              Explore Near You <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              to="/owner"
              className="inline-flex items-center gap-2 rounded-full border border-white/50 px-5 py-3 text-sm font-semibold"
            >
              List Your Property / Service
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      </section>

      {/* Categories */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-lg font-bold tracking-tight">Top Categories</h2>
          <Link to="/services" className="text-sm font-semibold text-primary">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-10">
          {CATEGORY_META.map((c) => (
            <Link
              key={c.slug}
              to="/explore"
              search={{ category: c.slug }}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center transition-shadow hover:shadow-md"
            >
              <AppIcon
                name={CATEGORY_ICON[c.slug] ?? "library"}
                className="h-10 w-10 transition-transform group-hover:scale-110"
              />
              <span className="text-[11px] font-medium leading-tight">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick filters */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {QUICK.map(({ label: l, sub, icon: Icon, tint, to }) => (
          <Link
            key={l}
            to={to}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 transition-shadow hover:shadow-md"
          >
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${tint}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{l}</span>
              <span className="block truncate text-xs text-muted-foreground">{sub}</span>
            </span>
          </Link>
        ))}
      </section>

      {/* Near you */}
      <Section
        title="Near You"
        href="/explore"
        loading={nearby.isPending}
        items={nearby.data ?? []}
        empty="No listings around you yet — try widening your location."
      />

      {/* Featured */}
      <Section
        title="Top Rated"
        href="/search"
        loading={featured.isPending}
        items={featured.data ?? []}
        empty="Top rated places will appear here soon."
      />

      {/* Trust bar */}
      <section className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4 lg:grid-cols-4">
        {TRUST.map(({ icon: Icon, title, sub }) => (
          <div key={title} className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{title}</span>
              <span className="block truncate text-xs text-muted-foreground">{sub}</span>
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}

function Section({
  title,
  href,
  loading,
  items,
  empty,
}: {
  title: string;
  href: "/explore" | "/search";
  loading: boolean;
  items: Awaited<ReturnType<typeof fetchListings>>;
  empty: string;
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="flex items-center gap-1.5 text-lg font-bold tracking-tight">
          {title} <MapPin className="h-4 w-4 text-primary" />
        </h2>
        <Link to={href} className="text-sm font-semibold text-primary">
          View all
        </Link>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.slice(0, 8).map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </section>
  );
}
