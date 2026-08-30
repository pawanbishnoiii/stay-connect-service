import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Star } from "lucide-react";
import { fetchListings } from "@/lib/listings";
import { useUserLocation } from "@/hooks/useLocation";
import { ListingMap } from "@/components/map/ListingMap";
import { ListingCard } from "@/components/listing/ListingCard";
import { CATEGORY_META } from "@/lib/categories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/map")({
  validateSearch: (s: Record<string, unknown>): { category?: string | undefined } => ({
    category: typeof s["category"] === "string" ? s["category"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Map View — Places Near You | LocalSpot" },
      {
        name: "description",
        content: "See verified libraries, PGs, gyms and services on an interactive map around you.",
      },
      { property: "og:title", content: "Map View — LocalSpot" },
      {
        property: "og:description",
        content: "Interactive map of verified local places and services near you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const category = useSearch({ from: "/map" }).category ?? "";
  const navigate = useNavigate();
  const { point, label } = useUserLocation();
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ["map", category, point.lat, point.lng],
    queryFn: () => fetchListings({ category: category || null, sort: "distance" }, point, 80),
  });

  const listings = data ?? [];
  const active = listings.find((l) => l.id === activeId) ?? null;

  const setCategory = (c: string) =>
    void navigate({ to: "/map", search: { category: c } });

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold tracking-tight">Map</h1>
        <p className="text-xs text-muted-foreground">Around {label}</p>
      </div>

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-2">
        <button
          type="button"
          onClick={() => setCategory("")}
          className={cn(
            "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold",
            !category ? "border-primary bg-primary/10 text-primary" : "border-border bg-card",
          )}
        >
          All
        </button>
        {CATEGORY_META.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => setCategory(c.slug)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold",
              category === c.slug
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="relative h-[58vh] overflow-hidden rounded-2xl border border-border lg:h-[72vh]">
          <ListingMap
            center={point}
            listings={listings}
            activeId={activeId}
            onSelect={setActiveId}
            zoom={13}
          />
          {active ? (
            <div className="absolute inset-x-3 bottom-3 z-[500] lg:hidden">
              <ListingCard listing={active} />
            </div>
          ) : null}
        </div>

        <aside className="hidden max-h-[72vh] space-y-3 overflow-y-auto pr-1 lg:block">
          <p className="text-sm text-muted-foreground">
            {isPending ? "Loading…" : `${listings.length} places on map`}
          </p>
          {listings.map((l) => (
            <button
              key={l.id}
              type="button"
              onMouseEnter={() => setActiveId(l.id)}
              onClick={() => setActiveId(l.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-colors",
                activeId === l.id ? "border-primary bg-primary/5" : "border-border bg-card",
              )}
            >
              <img
                src={l.cover_url ?? "/placeholder.svg"}
                alt={l.title}
                className="h-14 w-14 shrink-0 rounded-xl object-cover"
                loading="lazy"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{l.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {l.locality ?? l.city}
                  {l.distance_km != null ? ` · ${l.distance_km.toFixed(1)} km` : ""}
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-amber-600">
                  <Star className="h-3 w-3 fill-current" /> {Number(l.average_rating ?? 0).toFixed(1)}
                </span>
              </span>
            </button>
          ))}
        </aside>
      </div>
    </div>
  );
}
