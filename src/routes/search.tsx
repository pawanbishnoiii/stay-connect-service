import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { Search as SearchIcon, ShieldCheck, X } from "lucide-react";
import { fetchAmenities, fetchListings } from "@/lib/listings";
import { useUserLocation } from "@/hooks/useLocation";
import { ListingCard, ListingCardSkeleton } from "@/components/listing/ListingCard";
import { CATEGORY_META } from "@/lib/categories";
import { cn } from "@/lib/utils";

type SearchParams = {
  q?: string | undefined;
  category?: string | undefined;
  sort?: "distance" | "rating" | "price_low" | undefined;
  maxPrice?: number | undefined;
  radius?: number | undefined;
  verified?: boolean | undefined;
  amenities?: string | undefined;
};

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    q: typeof s["q"] === "string" ? s["q"] : undefined,
    category: typeof s["category"] === "string" ? s["category"] : undefined,
    sort:
      s["sort"] === "rating" || s["sort"] === "price_low"
        ? (s["sort"] as SearchParams["sort"])
        : undefined,
    maxPrice: Number(s["maxPrice"]) > 0 ? Number(s["maxPrice"]) : undefined,
    radius: Number(s["radius"]) > 0 ? Number(s["radius"]) : undefined,
    verified: s["verified"] === true || s["verified"] === "true" ? true : undefined,
    amenities: typeof s["amenities"] === "string" ? s["amenities"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Search Places & Services Near You — LocalSpot" },
      {
        name: "description",
        content:
          "Search verified libraries, gyms, PGs, hostels, tiffin, laundry and home services near you with price, amenity and distance filters.",
      },
      { property: "og:title", content: "Search — LocalSpot" },
      {
        property: "og:description",
        content: "Filter verified local places and services by price, amenities and distance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const raw = useSearch({ from: "/search" });
  const params = {
    q: raw.q ?? "",
    category: raw.category ?? "",
    sort: raw.sort ?? ("distance" as const),
    maxPrice: raw.maxPrice ?? 0,
    radius: raw.radius ?? 25,
    verified: raw.verified ?? false,
    amenities: raw.amenities ?? "",
  };
  const navigate = useNavigate();
  const { point, label } = useUserLocation();
  const [input, setInput] = useState(params.q);

  useEffect(() => setInput(params.q), [params.q]);

  const amenityList = useQuery({ queryKey: ["amenities"], queryFn: fetchAmenities });

  const selectedAmenities = params.amenities ? params.amenities.split(",").filter(Boolean) : [];

  const { data, isPending } = useQuery({
    queryKey: ["search", params, point.lat, point.lng],
    queryFn: () =>
      fetchListings(
        {
          query: params.q || null,
          category: params.category || null,
          sort: params.sort,
          maxPrice: params.maxPrice || null,
          radiusKm: params.radius,
          verifiedOnly: params.verified,
          amenities: selectedAmenities,
        },
        point,
        60,
      ),
  });

  const set = (patch: Partial<SearchParams>) =>
    void navigate({ to: "/search", search: (prev) => ({ ...prev, ...patch }) });

  function submit(e: FormEvent) {
    e.preventDefault();
    set({ q: input });
  }

  function toggleAmenity(slug: string) {
    const next = selectedAmenities.includes(slug)
      ? selectedAmenities.filter((s) => s !== slug)
      : [...selectedAmenities, slug];
    set({ amenities: next.join(",") });
  }

  const results = data ?? [];
  const hasFilters =
    !!params.category || params.verified || params.maxPrice > 0 || selectedAmenities.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      <form onSubmit={submit} className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search libraries, PGs, tiffin, services..."
          className="h-12 w-full rounded-full border border-border bg-card pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />
      </form>

      <div className="mt-4 grid gap-5 lg:grid-cols-[260px_1fr]">
        {/* Filters */}
        <aside className="space-y-5 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Filters</h2>
            {hasFilters ? (
              <button
                type="button"
                onClick={() =>
                  set({ category: "", verified: false, maxPrice: 0, amenities: "", radius: 25 })
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            ) : null}
          </div>

          <Group title="Category">
            <div className="flex flex-wrap gap-1.5">
              <Pill active={!params.category} onClick={() => set({ category: "" })}>
                All
              </Pill>
              {CATEGORY_META.map((c) => (
                <Pill
                  key={c.slug}
                  active={params.category === c.slug}
                  onClick={() => set({ category: c.slug })}
                >
                  {c.name}
                </Pill>
              ))}
            </div>
          </Group>

          <Group title="Sort by">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["distance", "Nearest"],
                  ["rating", "Top rated"],
                  ["price_low", "Price low"],
                ] as const
              ).map(([id, l]) => (
                <Pill key={id} active={params.sort === id} onClick={() => set({ sort: id })}>
                  {l}
                </Pill>
              ))}
            </div>
          </Group>

          <Group title={`Distance — within ${params.radius} km`}>
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={params.radius}
              onChange={(e) => set({ radius: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </Group>

          <Group title={params.maxPrice ? `Max price ₹${params.maxPrice}` : "Max price — any"}>
            <input
              type="range"
              min={0}
              max={20000}
              step={500}
              value={params.maxPrice}
              onChange={(e) => set({ maxPrice: Number(e.target.value) })}
              className="w-full accent-primary"
            />
          </Group>

          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={params.verified}
              onChange={(e) => set({ verified: e.target.checked })}
              className="h-4 w-4 accent-primary"
            />
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Verified only
          </label>

          <Group title="Amenities">
            <div className="flex flex-wrap gap-1.5">
              {(amenityList.data ?? []).slice(0, 16).map((a) => (
                <Pill
                  key={a.slug}
                  active={selectedAmenities.includes(a.slug)}
                  onClick={() => toggleAmenity(a.slug)}
                >
                  {a.name}
                </Pill>
              ))}
            </div>
          </Group>
        </aside>

        {/* Results */}
        <section>
          <p className="text-sm text-muted-foreground">
            {isPending
              ? "Searching…"
              : `${results.length} results${params.q ? ` for “${params.q}”` : ""} near ${label}`}
          </p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {isPending
              ? Array.from({ length: 6 }).map((_, i) => <ListingCardSkeleton key={i} />)
              : results.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
          {!isPending && results.length === 0 ? (
            <p className="mt-12 text-center text-sm text-muted-foreground">
              No matches. Try clearing filters or widening the distance.
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
        active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}
