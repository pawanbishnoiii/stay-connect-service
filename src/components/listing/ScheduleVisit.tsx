import { useState } from "react";
import { CalendarDays, Loader2, Video, Footprints } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const SLOTS = ["10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM"];

export function ScheduleVisit({
  listingId,
  ownerId,
  title,
}: {
  listingId: string;
  ownerId: string;
  title: string;
}) {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"physical" | "video">("physical");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [slot, setSlot] = useState(SLOTS[0]!);
  const [name, setName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!user) {
      toast.error("Sign in to schedule a visit");
      return;
    }
    if (!date) {
      toast.error("Pick a visit date");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      toast.error("Enter a valid 10-digit mobile");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("listing_visits").insert({
        listing_id: listingId,
        owner_id: ownerId,
        user_id: user.id,
        name: name || profile?.full_name || null,
        phone,
        visit_date: date.toISOString().slice(0, 10),
        visit_time: slot,
        mode,
      });
      if (error) throw error;
      toast.success(`Visit request sent to ${title}`);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not schedule the visit");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full" size="lg">
          <CalendarDays className="h-4 w-4" /> Schedule a visit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle>Schedule a visit</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["physical", "Physical", Footprints],
              ["video", "Video call", Video],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors",
                mode === key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Pick your visit date</p>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={{ before: new Date() }}
            className={cn("pointer-events-auto rounded-2xl border border-border p-3")}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {SLOTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSlot(s)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium",
                slot === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="v-name">Your name</Label>
            <Input id="v-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v-phone">Your phone</Label>
            <Input
              id="v-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile"
            />
          </div>
        </div>

        <Button onClick={() => void submit()} disabled={saving} size="lg">
          {saving ? <Loader2 className="animate-spin" /> : null}
          Confirm visit
        </Button>
      </DialogContent>
    </Dialog>
  );
}
