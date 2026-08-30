import { useEffect, useState } from "react";
import { Crosshair, MapPin, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUserLocation } from "@/hooks/useLocation";
import { searchPlaces, type PlaceSuggestion } from "@/lib/geo";

export function LocationPicker({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { setManual, detect, detecting, label } = useUserLocation();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.trim().length < 3) {
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        setItems(await searchPlaces(q, ctrl.signal));
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Choose your location</DialogTitle>
        </DialogHeader>

        <button
          type="button"
          onClick={() => {
            detect();
            onOpenChange(false);
          }}
          className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left text-sm font-medium"
        >
          <Crosshair className="h-4 w-4 text-primary" />
          {detecting ? "Detecting..." : "Use my current location"}
        </button>

        <p className="text-xs text-muted-foreground">Current: {label}</p>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search area, city, locality..."
            className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
        </div>

        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
              ))
            : items.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setManual({ lat: s.lat, lng: s.lng }, s.label);
                      onOpenChange(false);
                    }}
                    className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0">{s.label}</span>
                  </button>
                </li>
              ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
