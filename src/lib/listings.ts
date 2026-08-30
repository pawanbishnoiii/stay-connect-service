import { supabase } from "@/integrations/supabase/client";
import { haversineKm, type LatLng } from "@/lib/geo";

export type ListingRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  city: string | null;
  locality: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  price_current: number | null;
  price_original: number | null;
  price_unit: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  category_id: string | null;
  owner_id: string;
  is_verified: boolean | null;
  is_featured: boolean | null;
  phone: string | null;
  whatsapp: string | null;
  status: string;
  amenities?: string[] | null;
};

export type ListingWithDistance = ListingRow & {
  distance_km?: number | null;
  category_slug?: string | null;
  category_name?: string | null;
};

export type ListingFilters = {
  category?: string | null;
  query?: string | null;
  maxPrice?: number | null;
  minRating?: number | null;
  verifiedOnly?: boolean;
  radiusKm?: number;
  sort?: "distance" | "rating" | "price_low" | "price_high" | "newest";
};

const SELECT = `
  id, slug, title, description, cover_url, city, locality, address, lat, lng,
  price_current, price_original, price_unit, average_rating, total_reviews,
  category_id, owner_id, is_verified, is_featured, phone, whatsapp, status,
  categories:category_id ( slug, name )
`;

type Joined = ListingRow & { categories: { slug: string; name: string } | null };

export async function fetchListings(
  filters: ListingFilters,
  origin?: LatLng | null,
  limit = 60,
): Promise<ListingWithDistance[]> {
  let q = supabase.from("listings").select(SELECT).eq("status", "published").limit(limit);

  if (filters.query) q = q.or(`title.ilike.%${filters.query}%,locality.ilike.%${filters.query}%,city.ilike.%${filters.query}%`);
  if (filters.maxPrice) q = q.lte("price_current", filters.maxPrice);
  if (filters.minRating) q = q.gte("average_rating", filters.minRating);
  if (filters.verifiedOnly) q = q.eq("is_verified", true);

  if (filters.sort === "rating") q = q.order("average_rating", { ascending: false });
  else if (filters.sort === "price_low") q = q.order("price_current", { ascending: true });
  else if (filters.sort === "price_high") q = q.order("price_current", { ascending: false });
  else q = q.order("created_at", { ascending: false });

  const { data, error } = await q;
  if (error) throw error;

  let rows: ListingWithDistance[] = ((data ?? []) as unknown as Joined[]).map((r) => ({
    ...r,
    category_slug: r.categories?.slug ?? null,
    category_name: r.categories?.name ?? null,
    distance_km: origin && r.lat != null && r.lng != null ? haversineKm(origin, { lat: r.lat, lng: r.lng }) : null,
  }));

  if (filters.category) rows = rows.filter((r) => r.category_slug === filters.category);
  if (origin && filters.radiusKm) {
    rows = rows.filter((r) => r.distance_km == null || r.distance_km <= filters.radiusKm!);
  }
  if (filters.sort === "distance" || !filters.sort) {
    rows.sort((a, b) => (a.distance_km ?? 9e9) - (b.distance_km ?? 9e9));
  }
  return rows;
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, icon, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchListingBySlug(slug: string) {
  const { data, error } = await supabase
    .from("listings")
    .select(
      `*, categories:category_id ( slug, name ),
       listing_media ( id, url, media_type, sort_order ),
       listing_plans ( id, name, price, duration_days, description, is_active ),
       listing_services ( id, name, price, unit, description, is_active ),
       offers ( id, title, description, discount_type, discount_value, valid_until, is_active )`,
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}
