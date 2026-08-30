import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ListingCard, ListingCardSkeleton } from "@/components/listing/ListingCard";
import type { ListingWithDistance } from "@/lib/listings";
import { haversineKm } from "@/lib/geo";
import { useUserLocation } from "@/hooks/useLocation";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved Places & Services — LocalSpot" },
      { name: "description", content: "Your shortlisted libraries, PGs, gyms and services on LocalSpot." },
      { property: "og:title", content: "Saved — LocalSpot" },
      { property: "og:description", content: "Your shortlisted local places and services." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SavedPage,
});

function SavedPage() {
  const { user, loading } = useAuth();
  const { point } = useUserLocation();

  const { data, isPending } = useQuery({
    queryKey: ["saved", user?.id, point.lat, point.lng],
    enabled: !!user,
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favorites")
        .select("listing_id")
        .eq("user_id", user!.id);
      const ids = (favs ?? []).map((f) => f.listing_id);
      if (ids.length === 0) return [] as ListingWithDistance[];
      const { data: rows } = await supabase
        .from("listings")
        .select("*")
        .in("id", ids)
        .eq("status", "published");
      return (rows ?? []).map((r) => ({
        ...r,
        category_slug: null,
        distance_km:
          r.lat != null && r.lng != null
            ? haversineKm(point, { lat: Number(r.lat), lng: Number(r.lng) })
            : null,
      })) as unknown as ListingWithDistance[];
    },
  });

  if (!loading && !user) {
    return (
      <Empty
        title="Sign in to see saved places"
        sub="Save listings you like and find them here anytime."
        cta
      />
    );
  }

  const items = data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
        <Heart className="h-5 w-5 text-rose-500" /> Saved
      </h1>
      <p className="text-sm text-muted-foreground">Your shortlisted places & services</p>

      {isPending ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Empty title="Nothing saved yet" sub="Tap the heart on any listing to save it here." />
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}

function Empty({ title, sub, cta }: { title: string; sub: string; cta?: boolean }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <Heart className="mx-auto h-9 w-9 text-rose-500" />
      <h2 className="mt-3 text-lg font-bold">{title}</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">{sub}</p>
      <Link
        to={cta ? "/auth" : "/explore"}
        className="mt-5 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        {cta ? "Sign in" : "Explore nearby"}
      </Link>
    </div>
  );
}
