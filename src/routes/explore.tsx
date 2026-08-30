import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Map as MapIcon, SlidersHorizontal } from "lucide-react";
import { fetchListings } from "@/lib/listings";
import { useUserLocation } from "@/hooks/useLocation";
import { ListingCard, ListingCardSkeleton } from "@/components/listing/ListingCard";
import { CATEGORY_META } from "@/lib/categories";
import { AppIcon } from "@/components/AppIcon";
import { CATEGORY_ICON } from "@/lib/icons";
import { cn } from "@/lib/utils";

type ExploreSearch = {
  category?: string | undefined;
  sort?: "distance" | "rating" | "price_low" | undefined;
};

export const Route = createFileRoute("/explore")({
  validateSearch: (s: Record<string, unknown>): ExploreSearch => ({
    category: typeof s["category"] === "string" ? s["category"] : undefined,
    sort:
      s["sort"] === "rating" || s["sort"] === "price_low"
        ? (s["sort"] as ExploreSearch["sort"])
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Explore Nearby Places & Services — LocalSpot" },
      {
        name: "description",
        content:
          "Browse libraries, gyms, PGs, hostels, tiffin and laundry services near you, sorted by distance.",
      },
      { property: "og:title", content: "Explore Nearby — LocalSpot" },
      {
        property: "og:description",
        content: "Browse verified local places and services sorted by distance from you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExplorePage,
});

const SORTS = [
  { id: "distance", label: "Nearest" },
  { id: "rating", label: "Top Rated" },
  { id: "price_low", label: "Lowest Price" },
] as const;

function ExplorePage() {
  const search = useSearch({ from: "/explore" });
  const category = search.category ?? "";
  const sort = search.sort ?? "distance";
  const navigate = useNavigate();
  const { point, label } = useUserLocation();

  const { data, isPending } = useQuery({
    queryKey: ["explore", category, sort, point.lat, point.lng],
    queryFn: () => fetchListings({ category: category || null, sort }, point, 60),
  });

  const results = data ?? [];

  const set = (patch: Partial<ExploreSearch>) =>
    void navigate({ to: "/explore", search: (prev) => ({ ...prev, ...patch }) });

  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Explore</h1>
          <p className="text-sm text-muted-foreground">Around {label}</p>
        </div>
        <Link
          to="/map"
          search={{ category }}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"
        >
          <MapIcon className="h-4 w-4" /> View on Map
        </Link>
      </div>

      {/* category chips */}
      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2">
        <Chip active={!category} onClick={() => set({ category: "" })} label="All" />
        {CATEGORY_META.map((c) => (
          <Chip
            key={c.slug}
            active={category === c.slug}
            onClick={() => set({ category: c.slug })}
            label={c.name}
            icon={CATEGORY_ICON[c.slug]}
          />
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        {SORTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => set({ sort: s.id })}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              sort === s.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
        <Link to="/search" search={{ q: "", category }} className="ml-auto text-xs font-semibold text-primary">
          Advanced filters
        </Link>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {isPending ? "Finding places near you…" : `${results.length} places & services found`}
      </p>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isPending
          ? Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)
          : results.map((l) => <ListingCard key={l.id} listing={l} />)}
      </div>

      {!isPending && results.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">
          Nothing here yet. Try another category or change your location.
        </p>
      ) : null}
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: string | undefined;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors",
        active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card",
      )}
    >
      {icon ? <AppIcon name={icon} className="h-5 w-5" /> : null}
      {label}
    </button>
  );
}
