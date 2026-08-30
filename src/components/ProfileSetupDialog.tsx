import { useEffect, useRef, useState } from "react";
import { Loader2, Camera, BellRing, Check } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { uploadAvatar } from "@/lib/avatar";
import { registerPushDevice } from "@/lib/push";
import { cn } from "@/lib/utils";

const GENDERS = ["male", "female", "other"] as const;

/**
 * Shown once to signed-in users whose profile is incomplete
 * (name, gender or mobile missing). Saves straight to the database and
 * never re-appears for that user afterwards.
 */
export function ProfileSetupDialog() {
  const { user, profile, loading, refresh } = useAuth();
  const [open, setOpen] = useState(false);
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [gender, setGender] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [notify, setNotify] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const incomplete =
    !!user &&
    !!profile &&
    (!profile.full_name?.trim() || !profile.phone?.trim() || !profile.gender);

  useEffect(() => {
    if (loading) return;
    if (incomplete) {
      const parts = (profile?.full_name ?? "").trim().split(/\s+/).filter(Boolean);
      setFirst(parts[0] ?? "");
      setLast(parts.slice(1).join(" "));
      setPhone(profile?.phone ?? "");
      setGender(profile?.gender ?? "");
      setAvatar(profile?.avatar_url ?? null);
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [loading, incomplete, profile]);

  async function pick(file: File) {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setProgress(0);
    try {
      const url = await uploadAvatar(user.id, file, setProgress);
      setAvatar(url);
      toast.success("Photo uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setTimeout(() => setProgress(null), 600);
    }
  }

  async function save() {
    if (!user) return;
    const full = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (full.length < 3) return toast.error("Please enter your first and last name.");
    if (!gender) return toast.error("Please select your gender.");
    if (!/^[6-9]\d{9}$/.test(phone.trim())) return toast.error("Enter a valid 10-digit mobile number.");

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: full,
        phone: phone.trim(),
        gender,
        avatar_url: avatar,
        needs_onboarding: false,
        push_opted_in: notify,
      })
      .eq("id", user.id);
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    if (notify) void registerPushDevice(user.id).catch(() => undefined);
    await refresh();
    setOpen(false);
    toast.success("Profile saved");
  }

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-sm overflow-hidden rounded-3xl p-0 [&>button]:hidden">
        <div className="brand-gradient relative px-6 pb-10 pt-7 text-center text-primary-foreground">
          <div className="dot-bg absolute inset-0 opacity-30" />
          <h2 className="relative text-lg font-bold">Complete your profile</h2>
          <p className="relative mt-1 text-xs opacity-90">
            Owners need this to reply to you. It only takes a few seconds.
          </p>
        </div>

        <div className="-mt-6 space-y-3 rounded-t-3xl bg-card px-5 pb-6 pt-5">
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-full border-2 border-dashed border-border bg-muted"
            >
              {avatar ? (
                <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-6 w-6 text-muted-foreground" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void pick(f);
                e.target.value = "";
              }}
            />
            {progress != null ? (
              <div className="mt-2 h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ) : (
              <span className="mt-2 text-[11px] text-muted-foreground">Profile photo (optional)</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="First name" value={firstName} onChange={setFirst} placeholder="Pawan" />
            <Field label="Last name" value={lastName} onChange={setLast} placeholder="Bishnoi" />
          </div>

          <div>
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Gender</span>
            <div className="grid grid-cols-3 gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={cn(
                    "h-10 rounded-xl border text-xs font-semibold capitalize",
                    gender === g ? "border-primary bg-primary/10 text-primary" : "border-border bg-background",
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <Field
            label="Mobile number"
            value={phone}
            onChange={(v) => setPhone(v.replace(/\D/g, "").slice(0, 10))}
            placeholder="9876543210"
            inputMode="numeric"
          />

          <button
            type="button"
            onClick={() => setNotify((v) => !v)}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3 text-left"
          >
            <BellRing className="h-4 w-4 shrink-0 text-primary" />
            <span className="min-w-0 flex-1 text-xs text-muted-foreground">
              Notify me about new places, offers and replies near me
            </span>
            <span
              className={cn(
                "grid h-5 w-5 shrink-0 place-items-center rounded-md border",
                notify ? "border-primary bg-primary text-primary-foreground" : "border-border",
              )}
            >
              {notify ? <Check className="h-3 w-3" /> : null}
            </span>
          </button>

          <Button
            className="h-11 w-full rounded-xl text-sm font-semibold"
            onClick={() => void save()}
            disabled={saving}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save &amp; continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        value={value}
        inputMode={inputMode ?? "text"}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? ""}
        className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
      />
    </label>
  );
}
