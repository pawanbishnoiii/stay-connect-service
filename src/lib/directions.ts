import type { LatLng } from "@/lib/geo";

export type RouteResult = {
  points: Array<[number, number]>;
  distanceKm: number;
  durationMin: number;
};

/**
 * Free, key-less driving directions via the public OSRM demo server.
 * Returns a polyline the map can draw from the user to the place,
 * like a delivery app route.
 */
export async function fetchRoute(
  from: LatLng,
  to: LatLng,
  signal?: AbortSignal,
): Promise<RouteResult | null> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url, { signal: signal ?? null });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    routes?: Array<{
      distance: number;
      duration: number;
      geometry: { coordinates: [number, number][] };
    }>;
  };
  const route = data.routes?.[0];
  if (!route) return null;
  return {
    points: route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]),
    distanceKm: route.distance / 1000,
    durationMin: Math.round(route.duration / 60),
  };
}
