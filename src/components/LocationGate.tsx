import { useEffect, useState } from "react";
import { MapPin, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/AppIcon";
import { useUserLocation } from "@/hooks/useLocation";
import { LocationPicker } from "@/components/LocationPicker";

const ASKED_KEY = "localspot.location.asked";

/**
 * Auto-detects location on first open. If the browser blocks it (or detection
 * fails), the "Choose your location" card stays up so the user can pick manually.
 */
export function LocationGate() {
  const { detect, detecting, precise, label, permission, error } = useUserLocation();
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || tried || permission === "unknown") return;
    setTried(true);

    const asked = window.localStorage.getItem(ASKED_KEY) === "1";

    if (permission === "granted") {
      if (!precise) void detect();
      return;
    }
    if (permission === "denied" || permission === "unsupported") {
      if (!precise && !asked) setOpen(true);
      return;
    }
    if (!asked || !precise) setOpen(true);
  }, [tried, permission, precise, detect]);

  const blocked = permission === "denied" || permission === "unsupported";

  async function allow() {
    window.localStorage.setItem(ASKED_KEY, "1");
    const ok = await detect();
    if (ok) setOpen(false);
  }

  function manual() {
    window.localStorage.setItem(ASKED_KEY, "1");
    setOpen(false);
    setPickerOpen(true);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && manual()}>
        <DialogContent className="max-w-sm overflow-hidden rounded-3xl border-border/70 p-0 [&>button]:hidden">
          <div className="brand-gradient relative px-6 pb-10 pt-8 text-center text-primary-foreground">
            <div className="dot-bg absolute inset-0 opacity-30" />
            <AppIcon name="location" className="relative mx-auto h-16 w-16 drop-shadow" />
            <h2 className="relative mt-3 text-lg font-bold">Choose your location</h2>
            <p className="relative mt-1 text-sm opacity-90">
              LocalSpot shows verified places and services closest to you first.
            </p>
          </div>

          <div className="-mt-6 space-y-3 rounded-t-3xl bg-card px-6 pb-6 pt-5">
            {blocked || error ? (
              <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-xs text-muted-foreground">
                  {error ??
                    "Location access is blocked in your browser. Enable it in site settings, or pick your area manually below."}
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground">
                  We only use your coordinates to sort nearby results. You can change your area any
                  time from the header.
                </p>
              </div>
            )}

            <p className="text-center text-xs text-muted-foreground">Current area: {label}</p>

            {!blocked ? (
              <Button
                className="h-11 w-full rounded-xl text-sm font-semibold"
                onClick={() => void allow()}
                disabled={detecting}
              >
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
            ) : null}

            <Button
              variant={blocked ? "default" : "outline"}
              className="h-11 w-full rounded-xl text-sm font-semibold"
              onClick={manual}
            >
              Choose my area manually
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <LocationPicker open={pickerOpen} onOpenChange={setPickerOpen} />
    </>
  );
}
