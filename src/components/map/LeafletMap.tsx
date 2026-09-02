import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "@tanstack/react-router";
import { inr, km } from "@/lib/format";
import type { LatLng } from "@/lib/geo";
import type { ListingWithDistance } from "@/lib/listings";

const pin = (active: boolean) =>
  L.divIcon({
    className: "",
    html: `<span style="display:grid;place-items:center;width:${active ? 36 : 30}px;height:${
      active ? 36 : 30
    }px;border-radius:9999px;border:2px solid white;box-shadow:0 4px 12px rgba(0,0,0,.25);background:${
      active ? "#e0399b" : "#7c3aed"
    };color:#fff;font-size:11px;font-weight:700">●</span>`,
    iconSize: [active ? 36 : 30, active ? 36 : 30],
    iconAnchor: [active ? 18 : 15, active ? 18 : 15],
  });

const youPin = L.divIcon({
  className: "",
  html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;border:3px solid white;box-shadow:0 0 0 6px rgba(59,130,246,.25),0 4px 10px rgba(0,0,0,.25);background:#2563eb"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function Recenter({ center, route }: { center: LatLng; route?: Array<[number, number]> | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (route && route.length > 1) {
      map.fitBounds(L.latLngBounds(route), { padding: [30, 30] });
      return;
    }
    map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
  }, [center.lat, center.lng, map, route]);
  return null;
}

export default function LeafletMap({
  center,
  listings,
  activeId,
  onSelect,
  zoom = 13,
  route,
}: {
  center: LatLng;
  listings: ListingWithDistance[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  zoom?: number;
  route?: Array<[number, number]> | undefined;
}) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={zoom} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} route={route} />
      {route && route.length > 1 ? (
        <>
          <Polyline positions={route} pathOptions={{ color: "#ffffff", weight: 9, opacity: 0.9 }} />
          <Polyline positions={route} pathOptions={{ color: "#2563eb", weight: 5, opacity: 1 }} />
        </>
      ) : null}
      <Marker position={[center.lat, center.lng]} icon={youPin} zIndexOffset={1000}>
        <Popup>You are here</Popup>
      </Marker>
      {listings
        .filter((l) => l.lat != null && l.lng != null)
        .map((l) => (
          <Marker
            key={l.id}
            position={[l.lat as number, l.lng as number]}
            icon={pin(activeId === l.id)}
            eventHandlers={{ click: () => onSelect?.(l.id) }}
          >
            <Popup>
              <span className="block w-44">
                <span className="block text-xs font-semibold leading-snug">{l.title}</span>
                <span className="mt-0.5 block text-[11px] text-neutral-500">
                  {l.locality ?? l.city}
                  {l.distance_km != null ? ` · ${km(l.distance_km)}` : ""}
                </span>
                <span className="mt-1 block text-xs font-bold">{inr(l.price_current)}</span>
                <Link
                  to="/listing/$slug"
                  params={{ slug: l.slug }}
                  className="mt-2 block rounded-full bg-violet-600 px-3 py-1.5 text-center text-[11px] font-semibold !text-white no-underline"
                >
                  View details
                </Link>
              </span>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
