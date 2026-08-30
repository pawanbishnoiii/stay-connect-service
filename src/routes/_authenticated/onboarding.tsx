import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { AppIcon } from "@/components/AppIcon";
import { CATEGORY_ICON } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { reverseGeocodeDetail } from "@/lib/geo";
import {
  fetchMyBusiness,
  upsertBusiness,
  fetchCategories,
  fetchAmenities,
  createListing,
  setListingAmenities,
  uploadListingMedia,
  setNotificationPrefs,
  type AmenityRow,
  type CategoryRow,
} from "@/lib/owner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your business — LocalSpot" },
      {
        name: "description",
        content: "Create your business profile and publish your first listing on LocalSpot.",
      },
      { property: "og:title", content: "Set up your business — LocalSpot" },
      {
        property: "og:description",
        content: "Create your business profile and publish your first listing on LocalSpot.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnboardingPage,
});

const STEPS = ["Business details", "Category & location", "Your first listing", "Notifications"];

type FormState = {
  display_name: string;
  business_name: string;
  title: string;
  phone: string;
  whatsapp: string;
  started_year: string;
  primary_category_id: string;
  city: string;
  locality: string;
  state: string;
  pincode: string;
  district: string;
  village: string;
  lat: string;
  lng: string;
  location_confirmed: boolean;
  accepted_terms: boolean;
  accepted_refund_policy: boolean;

  listingTitle: string;
  description: string;
  price: string;
  price_unit: string;
  gender: string;
  address: string;
  amenityIds: string[];
  cover: File | null;
  push_enabled: boolean;
  bookings: boolean;
  payments: boolean;
  reviews: boolean;
  offers: boolean;
  nearby: boolean;
};

const INITIAL: FormState = {
  display_name: "",
  business_name: "",
  title: "",
  phone: "",
  whatsapp: "",
  started_year: "",
  primary_category_id: "",
  city: "",
  locality: "",
  state: "",
  pincode: "",
  district: "",
  village: "",
  lat: "",
  lng: "",
  location_confirmed: false,
  accepted_terms: false,
  accepted_refund_policy: false,

  listingTitle: "",
  description: "",
  price: "",
  price_unit: "month",
  gender: "any",
  address: "",
  amenityIds: [],
  cover: null,
  push_enabled: true,
  bookings: true,
  payments: true,
  reviews: true,
  offers: true,
  nearby: true,
};

function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [amenities, setAmenities] = useState<AmenityRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const [biz, cats, amens] = await Promise.all([
          fetchMyBusiness(user.id),
          fetchCategories(),
          fetchAmenities(),
        ]);
        if (!active) return;
        setCategories(cats);
        setAmenities(amens);
        if (biz) {
          setForm((f) => ({
            ...f,
            display_name: biz.display_name ?? "",
            business_name: biz.business_name ?? "",
            title: biz.title ?? "",
            phone: biz.phone ?? "",
            whatsapp: biz.whatsapp ?? "",
            started_year: biz.started_year ? String(biz.started_year) : "",
            primary_category_id: biz.primary_category_id ?? "",
            city: biz.city ?? "",
            locality: biz.locality ?? "",
            state: biz.state ?? "",
            pincode: biz.pincode ?? "",
            district: biz.district ?? "",
            village: biz.village ?? "",
            lat: biz.lat != null ? String(biz.lat) : "",
            lng: biz.lng != null ? String(biz.lng) : "",
            location_confirmed: Boolean(biz.location_confirmed),
            accepted_terms: Boolean(biz.accepted_terms),
            accepted_refund_policy: Boolean(biz.accepted_refund_policy),

          }));
          if (biz.onboarding_complete) setDone(true);
          else setStep(Math.max(0, Math.min((biz.onboarding_step ?? 1) - 1, 3)));
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not load onboarding");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const category = categories.find((c) => c.id === form.primary_category_id);

  async function saveStep1(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      await upsertBusiness({
        user_id: user.id,
        display_name: form.display_name,
        business_name: form.business_name || null,
        title: form.title || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        started_year: form.started_year ? Number(form.started_year) : null,
        onboarding_step: 2,
      });
      setStep(1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save business details");
    } finally {
      setBusy(false);
    }
  }

  async function detectLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Your browser does not support location. Fill the address manually.");
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const detail = await reverseGeocodeDetail(point).catch(() => null);
        setForm((f) => ({
          ...f,
          lat: String(point.lat),
          lng: String(point.lng),
          city: detail?.city || f.city,
          locality: detail?.locality || f.locality,
          state: detail?.state || f.state,
          pincode: detail?.pincode || f.pincode,
          district: detail?.district || f.district,
          village: detail?.village || f.village,
          address: detail?.address || f.address,
        }));
        setDetecting(false);
        toast.success("Location detected — please check and correct the fields.");
      },
      () => {
        setDetecting(false);
        toast.error("Location permission blocked. Search your area or fill it manually.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }

  async function saveStep2(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.primary_category_id) {
      toast.error("Please choose a category");
      return;
    }
    if (!form.city.trim()) {
      toast.error("City is required");
      return;
    }
    if (!form.location_confirmed) {
      toast.error("Please confirm your location is correct");
      return;
    }
    if (!form.accepted_terms || !form.accepted_refund_policy) {
      toast.error("Please accept the terms and refund policy");
      return;
    }
    setBusy(true);
    try {
      await upsertBusiness({
        user_id: user.id,
        primary_category_id: form.primary_category_id,
        city: form.city.trim() || null,
        locality: form.locality.trim() || null,
        state: form.state.trim() || null,
        pincode: form.pincode.trim() || null,
        district: form.district.trim() || null,
        village: form.village.trim() || null,
        lat: form.lat ? Number(form.lat) : null,
        lng: form.lng ? Number(form.lng) : null,
        location_confirmed: true,
        accepted_terms: true,
        accepted_refund_policy: true,
        onboarding_step: 3,
      });
      setStep(2);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `Could not save category & location: ${err.message}`
          : "Could not save category & location",
      );
    } finally {
      setBusy(false);
    }
  }


  async function saveStep3(e: FormEvent) {
    e.preventDefault();
    if (!user || !form.primary_category_id) return;
    if (!form.listingTitle.trim()) {
      toast.error("Give your listing a title");
      return;
    }
    setBusy(true);
    try {
      const listing = await createListing({
        owner_id: user.id,
        category_id: form.primary_category_id,
        title: form.listingTitle.trim(),
        description: form.description || null,
        price_current: form.price ? Number(form.price) : null,
        price_unit: form.price_unit,
        gender_preference: form.gender,
        address: form.address || null,
        city: form.city || null,
        locality: form.locality || null,
        state: form.state || null,
        pincode: form.pincode || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
      });
      if (form.cover) {
        await uploadListingMedia(listing.id, user.id, form.cover, { isCover: true });
      }
      if (form.amenityIds.length > 0) {
        await setListingAmenities(listing.id, form.amenityIds);
      }
      await upsertBusiness({ user_id: user.id, onboarding_step: 4 });
      setStep(3);
      toast.success("Your listing is live!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not publish listing");
    } finally {
      setBusy(false);
    }
  }

  async function saveStep4(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      await setNotificationPrefs(user.id, {
        push_enabled: form.push_enabled,
        bookings: form.bookings,
        payments: form.payments,
        reviews: form.reviews,
        offers: form.offers,
        nearby: form.nearby,
      }).catch(() => {
        /* preferences are optional */
      });
      await upsertBusiness({ user_id: user.id, onboarding_complete: true, onboarding_step: 5 });
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not finish onboarding");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <AppIcon name="dashboard" className="mx-auto h-16 w-16" />
        <h1 className="mt-4 text-xl font-semibold">You're all set!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your business profile is ready. Head to your dashboard to manage listings, orders and
          customers.
        </p>
        <Button className="mt-6" onClick={() => void navigate({ to: "/owner" })}>
          Open dashboard <ChevronRight />
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => (step === 0 ? void navigate({ to: "/" }) : setStep(step - 1))}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-card"
          aria-label="Back"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Step {step + 1} of 4</span>
            <span className="truncate">{STEPS[step]}</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="brand-gradient h-full rounded-full transition-all"
              style={{ width: `${((step + 1) / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {step === 0 ? (
        <form onSubmit={saveStep1} className="mt-8 space-y-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Tell us about your business</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This appears on your public profile and listings.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ob-name">Your name *</Label>
            <Input
              id="ob-name"
              value={form.display_name}
              onChange={(e) => set("display_name", e.target.value)}
              placeholder="Rahul Sharma"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ob-biz">Business name</Label>
            <Input
              id="ob-biz"
              value={form.business_name}
              onChange={(e) => set("business_name", e.target.value)}
              placeholder="Sharma Study Zone"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ob-tag">Tagline</Label>
            <Input
              id="ob-tag"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="AC library with 200 seats"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ob-phone">Phone *</Label>
              <Input
                id="ob-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="10-digit mobile"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ob-wa">WhatsApp number</Label>
              <Input
                id="ob-wa"
                type="tel"
                value={form.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
                placeholder="with country code, e.g. 91…"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ob-year">Started in (year)</Label>
            <Input
              id="ob-year"
              type="number"
              min={1990}
              max={2026}
              value={form.started_year}
              onChange={(e) => set("started_year", e.target.value)}
              placeholder="2021"
            />
          </div>
          <StepFooter busy={busy} onBack={() => void navigate({ to: "/" })} />
        </form>
      ) : null}

      {step === 1 ? (
        <form onSubmit={saveStep2} className="mt-8 space-y-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">What do you offer?</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick the category and your service area.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((c) => {
              const active = form.primary_category_id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => set("primary_category_id", c.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors",
                    active
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-card hover:bg-accent",
                  )}
                >
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                    style={{ backgroundColor: `${c.color ?? "#7c3aed"}1f`, color: c.color ?? "#7c3aed" }}
                  >
                    <AppIcon name={CATEGORY_ICON[c.slug] ?? "home"} className="h-7 w-7" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{c.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {c.description}
                    </span>
                  </span>
                  {active ? (
                    <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ob-city">City *</Label>
              <Input
                id="ob-city"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Jaipur"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ob-loc">Locality</Label>
              <Input
                id="ob-loc"
                value={form.locality}
                onChange={(e) => set("locality", e.target.value)}
                placeholder="Mansarovar"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ob-state">State</Label>
              <Input
                id="ob-state"
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                placeholder="Rajasthan"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ob-pin">PIN code</Label>
              <Input
                id="ob-pin"
                value={form.pincode}
                onChange={(e) => set("pincode", e.target.value)}
                placeholder="302020"
              />
            </div>
          </div>
          <StepFooter busy={busy} onBack={() => setStep(0)} />
        </form>
      ) : null}

      {step === 2 ? (
        <form onSubmit={saveStep3} className="mt-8 space-y-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Your first listing</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {category ? (
                <>
                  Category: <span className="font-semibold text-foreground">{category.name}</span>
                </>
              ) : null}{" "}
              — it goes live instantly and appears on LocalSpot.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ob-lt">Listing title *</Label>
            <Input
              id="ob-lt"
              value={form.listingTitle}
              onChange={(e) => set("listingTitle", e.target.value)}
              placeholder="e.g. Sunrise Library — AC study hall, 200 seats"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ob-price">Price (₹) *</Label>
              <Input
                id="ob-price"
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="1500"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Per</Label>
              <Select value={form.price_unit} onValueChange={(v) => set("price_unit", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">month</SelectItem>
                  <SelectItem value="day">day</SelectItem>
                  <SelectItem value="visit">visit</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="item">item</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {category?.kind === "place" ? (
            <div className="space-y-1.5">
              <Label>Preferred for</Label>
              <Select value={form.gender} onValueChange={(v) => set("gender", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Everyone</SelectItem>
                  <SelectItem value="male">Boys only</SelectItem>
                  <SelectItem value="female">Girls only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="ob-desc">Description</Label>
            <Textarea
              id="ob-desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What makes your place special? Timings, capacity, perks…"
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ob-addr">Full address</Label>
            <Input
              id="ob-addr"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Shop 12, Main Market…"
            />
          </div>
          <div className="space-y-2">
            <Label>Amenities</Label>
            <div className="flex flex-wrap gap-2">
              {amenities.map((a) => {
                const on = form.amenityIds.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() =>
                      set(
                        "amenityIds",
                        on
                          ? form.amenityIds.filter((id) => id !== a.id)
                          : [...form.amenityIds, a.id],
                      )
                    }
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      on
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    <AppIcon name={a.icon ?? "bookmark"} className="h-4 w-4" />
                    {a.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Cover photo</Label>
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground hover:bg-accent">
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="h-16 w-16 rounded-xl object-cover"
                />
              ) : (
                <AppIcon name="gallery" className="h-8 w-8" />
              )}
              <span>{form.cover ? form.cover.name : "Tap to upload a cover photo"}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  set("cover", file);
                  setCoverPreview(file ? URL.createObjectURL(file) : null);
                }}
              />
            </label>
          </div>
          <StepFooter busy={busy} onBack={() => setStep(1)} />
        </form>
      ) : null}

      {step === 3 ? (
        <form onSubmit={saveStep4} className="mt-8 space-y-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Stay in the loop</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose what you want to be notified about.
            </p>
          </div>
          <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
            {(
              [
                ["push_enabled", "Push notifications"],
                ["bookings", "New bookings & orders"],
                ["payments", "Payment received"],
                ["reviews", "New reviews"],
                ["offers", "Offers & campaigns"],
                ["nearby", "Nearby students"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                </div>
                <Switch
                  checked={form[key]}
                  onCheckedChange={(v) => set(key, v)}
                  aria-label={label}
                />
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm">
            <p className="font-semibold text-foreground">Almost done! 🎉</p>
            <p className="mt-1 text-muted-foreground">
              You'll land on your owner dashboard where you can add more listings, photos, plans
              and track orders.
            </p>
          </div>
          <StepFooter busy={busy} onBack={() => setStep(2)} last />
        </form>
      ) : null}
    </div>
  );
}

function StepFooter({
  busy,
  onBack,
  last = false,
}: {
  busy: boolean;
  onBack: () => void;
  last?: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      <Button type="button" variant="ghost" onClick={onBack} disabled={busy}>
        Back
      </Button>
      <Button type="submit" disabled={busy} size="lg">
        {busy ? <Loader2 className="animate-spin" /> : null}
        {last ? "Finish" : "Continue"}
        <ChevronRight />
      </Button>
    </div>
  );
}