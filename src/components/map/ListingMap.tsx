import { lazy, Suspense } from "react";
import { ClientOnly } from "@/components/ClientOnly";
import type { LatLng } from "@/lib/geo";
import type { ListingWithDistance } from "@/lib/listings";

const LeafletMap = lazy(() => import("./LeafletMap"));

const Fallback = () => <div className="h-full w-full animate-pulse bg-muted" />;

export function ListingMap(props: {
  center: LatLng;
  listings: ListingWithDistance[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  zoom?: number;
}) {
  return (
    <ClientOnly fallback={<Fallback />}>
      <Suspense fallback={<Fallback />}>
        <LeafletMap {...props} />
      </Suspense>
    </ClientOnly>
  );
}
