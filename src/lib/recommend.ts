import { supabase } from "@/integrations/supabase/client";
import { haversineKm, type LatLng } from "@/lib/geo";
import type { ListingWithDistance } from "@/lib/listings";

export type Affinity = {
  /** category slug -> weight (0..1) built from recent views + favorites */
  categories: Record<string, number>;
};

export const EMPTY_AFFINITY: Affinity = { categories: {} };

/**
 * Builds a lightweight taste profile for a signed-in user from
 * recently viewed listings and favorites. Anonymous users get an
 * empty profile and are ranked purely on distance + quality.
 */
export async function fetchAffinity(userId?: string | null): Promise<Affinity> {
  if (!userId) return EMPTY_AFFINITY;
  const [{ data: viewed }, { data: favs }] = await Promise.all([
    supabase
      .from("recently_viewed")
      .select("listings:listing_id ( categories:category_id ( slug ) )")
      .eq("user_id", userId)
      .order("viewed_at", { ascending: false })
      .limit(30),
    supabase
      .from("favorites")
      .select("listings:listing_id ( categories:category_id ( slug ) )")
      .eq("user_id", userId)
      .limit(30),
  ]);

  type Nested = { listings: { categories: { slug: string } | null } | null };
  const counts: Record<string, number> = {};
  const bump = (rows: unknown, weight: number) => {
    for (const r of (rows ?? []) as Nested[]) {
      const slug = r.listings?.categories?.slug;
      if (!slug) continue;
      counts[slug] = (counts[slug] ?? 0) + weight;
    }
  };
  bump(viewed, 1);
  bump(favs, 2);

  const max = Math.max(1, ...Object.values(counts));
  const categories: Record<string, number> = {};
  for (const [slug, n] of Object.entries(counts)) categories[slug] = n / max;
  return { categories };
}

/** Distance score: 1 at 0 km, ~0.5 at 3 km, → 0 beyond ~25 km. */
function distanceScore(km: number | null | undefined): number {
  if (km == null) return 0.25;
  return 1 / (1 + km / 3);
}

export type ScoredListing = ListingWithDistance & { score: number; reason: string };

/**
 * Nearest-first suggestion algorithm. Distance is the dominant signal
 * (compared across every candidate), then rating, popularity, category
 * affinity, verification and offers.
 */
export function rankListings(
  listings: ListingWithDistance[],
  origin?: LatLng | null,
  affinity: Affinity = EMPTY_AFFINITY,
): ScoredListing[] {
  const withDistance = listings.map((l) => {
    const distance_km =
      l.distance_km ??
      (origin && l.lat != null && l.lng != null
        ? haversineKm(origin, { lat: l.lat, lng: l.lng })
        : null);
    return { ...l, distance_km };
  });

  const scored = withDistance.map((l) => {
    const d = distanceScore(l.distance_km);
    const rating = Math.min(1, (Number(l.average_rating) || 0) / 5);
    const reviews = Math.min(1, Math.log10(1 + (l.total_reviews ?? 0)) / 2);
    const affinityScore = affinity.categories[l.category_slug ?? ""] ?? 0;
    const verified = l.verification === "verified" ? 1 : 0;
    const featured = l.is_featured ? 1 : 0;
    const discount =
      l.price_original && l.price_current && l.price_original > l.price_current ? 1 : 0;

    const score =
      d * 0.5 +
      rating * 0.16 +
      reviews * 0.08 +
      affinityScore * 0.14 +
      verified * 0.06 +
      featured * 0.03 +
      discount * 0.03;

    let reason = "Popular around you";
    if (l.distance_km != null && l.distance_km < 2) reason = "Very close to you";
    else if (affinityScore > 0.4) reason = "Matches what you browse";
    else if ((Number(l.average_rating) || 0) >= 4.5) reason = "Top rated nearby";
    else if (discount) reason = "Great price nearby";

    return { ...l, score, reason };
  });

  return scored.sort((a, b) => b.score - a.score);
}
