export type LatLng = { lat: number; lng: number };

export const DEFAULT_LOCATION: LatLng & { label: string } = {
  lat: 26.8505,
  lng: 75.7628,
  label: "Mansarovar, Jaipur",
};

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(la1) * Math.cos(la2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type PlaceSuggestion = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

/** Free, key-less geocoding via OpenStreetMap Nominatim. */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceSuggestion[]> {
  if (query.trim().length < 3) return [];
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "6");
  url.searchParams.set("countrycodes", "in");
  const res = await fetch(url, { signal: signal ?? null, headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const rows = (await res.json()) as Array<{
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
  }>;
  return rows.map((r) => ({
    id: String(r.place_id),
    label: r.display_name.split(",").slice(0, 3).join(", "),
    lat: Number(r.lat),
    lng: Number(r.lon),
  }));
}

export async function reverseGeocode(point: LatLng, signal?: AbortSignal): Promise<string | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(point.lat));
  url.searchParams.set("lon", String(point.lng));
  url.searchParams.set("format", "jsonv2");
  const res = await fetch(url, { signal: signal ?? null, headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = (await res.json()) as { address?: Record<string, string>; display_name?: string };
  const a = data.address ?? {};
  const parts = [a["suburb"] ?? a["neighbourhood"] ?? a["village"], a["city"] ?? a["town"] ?? a["state_district"]]
    .filter(Boolean)
    .join(", ");
  return parts || data.display_name?.split(",").slice(0, 2).join(", ") || null;
}

export type AddressDetail = {
  label: string;
  address: string;
  village: string;
  locality: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
};

/** Reverse geocode into structured Indian address fields (free OSM Nominatim). */
export async function reverseGeocodeDetail(
  point: LatLng,
  signal?: AbortSignal,
): Promise<AddressDetail | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(point.lat));
  url.searchParams.set("lon", String(point.lng));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  const res = await fetch(url, { signal: signal ?? null, headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = (await res.json()) as { address?: Record<string, string>; display_name?: string };
  const a = data.address ?? {};
  const pick = (...keys: string[]) => keys.map((k) => a[k]).find(Boolean) ?? "";
  const city = pick("city", "town", "municipality", "village", "state_district");
  return {
    label: data.display_name?.split(",").slice(0, 3).join(", ") ?? "",
    address: data.display_name ?? "",
    village: pick("village", "hamlet"),
    locality: pick("suburb", "neighbourhood", "quarter", "residential", "city_district"),
    city,
    district: pick("state_district", "county", "district"),
    state: pick("state"),
    pincode: pick("postcode"),
  };
}
