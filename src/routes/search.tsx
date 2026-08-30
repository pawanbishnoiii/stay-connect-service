import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Search as SearchIcon } from "lucide-react";
import { fetchListings } from "@/lib/listings";
import { useUserLocation } from "@/hooks/useLocation";
import { ListingCard, ListingCardSkeleton } from "@/components/listing/ListingCard";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : "" }),
  head: () => ({
    meta: [
      { title: "Search — LocalSpot" },
      {
        name: "description",
        content:
          "Search verified libraries, gyms, PGs, hostels, tiffin, laundry and services near you.",
      },
      { property: "og:title", content: "Search — LocalSpot" },
      {
        property: "og:description",
        content: "Search verified libraries, gyms, PGs, tiffin, laundry and services near you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = useSearch({ from: "/search" });
  const navigate = useNavigate();
  const { point } = useUserLocation();
  const [input, setInput] = useState(q);

  const { data, isPending } = useQuery({
    queryKey: ["search", q, point.lat, point.lng],
    queryFn: () => fetchListings({ query: q || null }, point, 60),
    enabled: q.trim().length > 0,
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    void navigate({ to: "/search", search: { q: input } });
  }

  const results = data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <form onSubmit={submit} className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search libraries, PGs, tiffin, services..."
          className="h-12 w-full rounded-full border border-border bg-card pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />
      </form>

      <p className="mt-5 text-sm text-muted-foreground">
        {q.trim()
          ? `${results.length} result${results.length === 1 ? "" : "s"} for "${q}"`
          : "Start typing to search places & services near you"}
      </p>

      {isPending && q.trim() ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : q.trim() ? (
        results.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center text-sm text-muted-foreground">
            No results found for "{q}". Try a different search.
          </div>
        )
      ) : null}
    </div>
  );
}