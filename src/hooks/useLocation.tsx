import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LOCATION, reverseGeocode, type LatLng } from "@/lib/geo";

type LocationState = {
  point: LatLng;
  label: string;
  precise: boolean;
  detecting: boolean;
  setManual: (point: LatLng, label: string) => void;
  detect: () => void;
};

const LocationContext = createContext<LocationState | null>(null);
const STORAGE_KEY = "localspot.location";

export function LocationProvider({ children }: { children: ReactNode }) {
  const [point, setPoint] = useState<LatLng>({ lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng });
  const [label, setLabel] = useState(DEFAULT_LOCATION.label);
  const [precise, setPrecise] = useState(false);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { lat: number; lng: number; label: string; precise?: boolean };
      setPoint({ lat: saved.lat, lng: saved.lng });
      setLabel(saved.label);
      setPrecise(Boolean(saved.precise));
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((next: LatLng, nextLabel: string, isPrecise: boolean) => {
    setPoint(next);
    setLabel(nextLabel);
    setPrecise(isPrecise);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, label: nextLabel, precise: isPrecise }));
    } catch {
      /* ignore */
    }
  }, []);

  const detect = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const name = await reverseGeocode(next).catch(() => null);
        persist(next, name ?? "Current location", true);
        setDetecting(false);
      },
      () => setDetecting(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, [persist]);

  const value = useMemo<LocationState>(
    () => ({
      point,
      label,
      precise,
      detecting,
      detect,
      setManual: (next, nextLabel) => persist(next, nextLabel, false),
    }),
    [point, label, precise, detecting, detect, persist],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useUserLocation(): LocationState {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useUserLocation must be used inside LocationProvider");
  return ctx;
}
