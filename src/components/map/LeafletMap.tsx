import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "@tanstack/react-router";
import { inr } from "@/lib/format";
import type { LatLng } from "@/lib/geo";
import type { ListingWithDistance } from "@/lib/listings";

const pin = (active: boolean) =>
  L.divIcon({
    className: "",
    html: `<span style="display:grid;place-items:center;width:30px;height:30px;border-radius:9999px;border:2px solid white;box-shadow:0 4px 12px rgba(0,0,0,.25);background:${
      active ? "#e0399b" : "#7c3aed"
    };color:#fff;font-size:11px;font-weight:700">●</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

function Recenter({ center }: { center: LatLng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
  }, [center.lat, center.lng, map]);
  return null;
}

export default function LeafletMap({
  center,
  listings,
  activeId,
  onSelect,
  zoom = 13,
}: {
  center: LatLng;
  listings: ListingWithDistance[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  zoom?: number;
}) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={zoom} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} />
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
              <Link to="/listing/$slug" params={{ slug: l.slug }} className="block text-xs font-semibold">
                {l.title}
              </Link>
              <span className="text-xs">{inr(l.price_current)}</span>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
