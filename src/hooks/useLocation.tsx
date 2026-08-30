import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_LOCATION, haversineKm, reverseGeocode, type LatLng } from "@/lib/geo";

export type LocationPermission = "unknown" | "prompt" | "granted" | "denied" | "unsupported";

type LocationState = {
  point: LatLng;
  label: string;
  precise: boolean;
  detecting: boolean;
  error: string | null;
  permission: LocationPermission;
  live: boolean;
  setLive: (v: boolean) => void;
  setManual: (point: LatLng, label: string) => void;
  detect: () => Promise<boolean>;
};

const LocationContext = createContext<LocationState | null>(null);
const STORAGE_KEY = "localspot.location";
const LIVE_KEY = "localspot.location.live";

export function LocationProvider({ children }: { children: ReactNode }) {
  const [point, setPoint] = useState<LatLng>({ lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng });
  const [label, setLabel] = useState(DEFAULT_LOCATION.label);
  const [precise, setPrecise] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<LocationPermission>("unknown");
  const [live, setLiveState] = useState(false);
  const watchRef = useRef<number | null>(null);
  const lastPoint = useRef<LatLng | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { lat: number; lng: number; label: string; precise?: boolean };
        setPoint({ lat: saved.lat, lng: saved.lng });
        setLabel(saved.label);
        setPrecise(Boolean(saved.precise));
        lastPoint.current = { lat: saved.lat, lng: saved.lng };
      }
      setLiveState(window.localStorage.getItem(LIVE_KEY) !== "0");
    } catch {
      /* ignore */
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPermission("unsupported");
      return;
    }
    let cancelled = false;
    navigator.permissions
      ?.query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (cancelled) return;
        setPermission(status.state as LocationPermission);
        status.onchange = () => setPermission(status.state as LocationPermission);
      })
      .catch(() => setPermission("prompt"));
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: LatLng, nextLabel: string, isPrecise: boolean) => {
    setPoint(next);
    setLabel(nextLabel);
    setPrecise(isPrecise);
    lastPoint.current = next;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...next, label: nextLabel, precise: isPrecise }),
      );
    } catch {
      /* ignore */
    }
  }, []);

  const detect = useCallback(async (): Promise<boolean> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPermission("unsupported");
      setError("Your browser does not support location.");
      return false;
    }
    setDetecting(true);
    setError(null);
    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          const name = await reverseGeocode(next).catch(() => null);
          persist(next, name ?? "Current location", true);
          setPermission("granted");
          setDetecting(false);
          resolve(true);
        },
        (err) => {
          setDetecting(false);
          if (err.code === err.PERMISSION_DENIED) {
            setPermission("denied");
            setError("Location permission was blocked. Choose your area manually.");
          } else {
            setError("We couldn't get your location. Try again or pick your area manually.");
          }
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
      );
    });
  }, [persist]);

  // Live tracking: results follow the user while they move.
  useEffect(() => {
    if (!live || permission !== "granted" || typeof navigator === "undefined" || !navigator.geolocation) {
      if (watchRef.current != null) {
        navigator.geolocation?.clearWatch(watchRef.current);
        watchRef.current = null;
      }
      return;
    }
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const prev = lastPoint.current;
        // Only re-sort results after a meaningful move (300 m).
        if (prev && haversineKm(prev, next) < 0.3) return;
        const name = await reverseGeocode(next).catch(() => null);
        persist(next, name ?? "Current location", true);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 20000, timeout: 20000 },
    );
    return () => {
      if (watchRef.current != null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
    };
  }, [live, permission, persist]);

  const setLive = useCallback((v: boolean) => {
    setLiveState(v);
    try {
      window.localStorage.setItem(LIVE_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<LocationState>(
    () => ({
      point,
      label,
      precise,
      detecting,
      error,
      permission,
      live,
      setLive,
      detect,
      setManual: (next, nextLabel) => persist(next, nextLabel, false),
    }),
    [point, label, precise, detecting, error, permission, live, setLive, detect, persist],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useUserLocation(): LocationState {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useUserLocation must be used inside LocationProvider");
  return ctx;
}
