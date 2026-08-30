import { useEffect, useState } from "react";
import { MapPin, Loader2, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/AppIcon";
import { useUserLocation } from "@/hooks/useLocation";
import { LocationPicker } from "@/components/LocationPicker";

const ASKED_KEY = "localspot.location.asked";

/**
 * Shown once on first app open: asks for location permission.
 * After the browser grant is stored, later visits auto-detect silently.
 */
export function LocationGate() {
  const { detect, detecting, precise, label } = useUserLocation();
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || checked) return;
    setChecked(true);
    let cancelled = false;

    (async () => {
      const asked = window.localStorage.getItem(ASKED_KEY) === "1";
      let state: PermissionState | null = null;
      try {
        state = (await navigator.permissions?.query({ name: "geolocation" as PermissionName }))
          ?.state as PermissionState;
      } catch {
        state = null;
      }
      if (cancelled) return;

      if (state === "granted") {
        // Already approved before — silently refresh the position.
        if (!precise) detect();
        return;
      }
      if (state === "denied") return;
      if (!asked || !precise) setOpen(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [checked, detect, precise]);

  function allow() {
    window.localStorage.setItem(ASKED_KEY, "1");
    detect();
    setTimeout(() => setOpen(false), 900);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent
          className="max-w-sm overflow-hidden rounded-3xl border-border/70 p-0 [&>button]:hidden"
        >
          <div className="brand-gradient relative px-6 pb-10 pt-8 text-center text-primary-foreground">
            <div className="dot-bg absolute inset-0 opacity-30" />
            <AppIcon name="location" className="relative mx-auto h-16 w-16 drop-shadow" />
            <h2 className="relative mt-3 text-lg font-bold">Enable your location</h2>
            <p className="relative mt-1 text-sm opacity-90">
              LocalSpot shows verified places and services closest to you first.
            </p>
          </div>

          <div className="-mt-6 space-y-3 rounded-t-3xl bg-card px-6 pb-6 pt-5">
            <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs text-muted-foreground">
                We only use your coordinates to sort nearby results. You can change your area any
                time from the header.
              </p>
            </div>

            <p className="text-center text-xs text-muted-foreground">Current area: {label}</p>

            <Button className="h-11 w-full rounded-xl text-sm font-semibold" onClick={allow}>
              {detecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Detecting your location...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" /> Allow &amp; detect automatically
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={() => {
                window.localStorage.setItem(ASKED_KEY, "1");
                setOpen(false);
                setPickerOpen(true);
              }}
              className="w-full rounded-xl py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Choose my area manually instead
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <LocationPicker open={pickerOpen} onOpenChange={setPickerOpen} />
    </>
  );
}
