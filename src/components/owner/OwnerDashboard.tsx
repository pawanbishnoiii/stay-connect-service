import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowRight, Building2, Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { inr } from "@/lib/format";
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
import { toast } from "sonner";
import {
  fetchMyBusiness,
  fetchCategories,
  fetchAmenities,
  fetchMyListings,
  fetchMyBookings,
  fetchMyCustomers,
  fetchLedger,
  fetchExpenses,
  createListing,
  updateListing,
  setListingStatus,
  setListingAmenities,
  uploadListingMedia,
  deleteListingMedia,
  signedMediaUrl,
  updateBookingStatus,
  updateBookingPayment,
  addCustomer,
  updateCustomer,
  addLedgerEntry,
  addExpense,
  fmtDate,
  ORDER_STATES,
  PAY_METHODS,
  type MyListing,
  type MyBooking,
  type CustomerRow,
  type MyLedger,
  type ExpenseRow,
  type CategoryRow,
  type AmenityRow,
} from "@/lib/owner";

export const Route = createFileRoute("/_authenticated/owner")({
  head: () => ({
    meta: [
      { title: "Owner Dashboard — LocalSpot" },
      {
        name: "description",
        content: "Manage your listings, bookings, customers and finances on LocalSpot.",
      },
      { property: "og:title", content: "Owner Dashboard — LocalSpot" },
      {
        property: "og:description",
        content: "Manage your listings, bookings, customers and finances on LocalSpot.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OwnerPage,
});

const TABS = [
  { id: "overview", label: "Overview", icon: "dashboard" },
  { id: "listings", label: "Listings", icon: "my-listings" },
  { id: "bookings", label: "Bookings", icon: "bookings" },
  { id: "customers", label: "Customers", icon: "profile" },
  { id: "finance", label: "Finance", icon: "balance" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type EditorState = {
  editingId: string | null;
  title: string;
  description: string;
  price: string;
  price_unit: string;
  gender: string;
  address: string;
  city: string;
  locality: string;
  state: string;
  pincode: string;
  phone: string;
  whatsapp: string;
  amenityIds: string[];
  coverFile: File | null;
  galleryFiles: File[];
};

const EMPTY_EDITOR: EditorState = {
  editingId: null,
  title: "",
  description: "",
  price: "",
  price_unit: "month",
  gender: "any",
  address: "",
  city: "",
  locality: "",
  state: "",
  pincode: "",
  phone: "",
  whatsapp: "",
  amenityIds: [],
  coverFile: null,
  galleryFiles: [],
};

function OwnerPage() {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [tab, setTab] = useState<TabId>("overview");
  const [data, setData] = useState<{
    biz: Awaited<ReturnType<typeof fetchMyBusiness>>;
    categories: CategoryRow[];
    amenities: AmenityRow[];
    listings: MyListing[];
    bookings: MyBooking[];
    customers: CustomerRow[];
    ledger: MyLedger[];
    expenses: ExpenseRow[];
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editor, setEditor] = useState<EditorState>(EMPTY_EDITOR);
  const [savingListing, setSavingListing] = useState(false);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const [biz, categories, amenities, listings, bookings, customers, ledger, expenses] =
        await Promise.all([
          fetchMyBusiness(user.id),
          fetchCategories(),
          fetchAmenities(),
          fetchMyListings(user.id),
          fetchMyBookings(user.id),
          fetchMyCustomers(user.id),
          fetchLedger(user.id),
          fetchExpenses(user.id),
        ]);
      setData({ biz, categories, amenities, listings, bookings, customers, ledger, expenses });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load dashboard");
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) void loadAll();
  }, [user, loadAll]);

  const stats = useMemo(() => {
    const d = data;
    if (!d) return null;
    const paid = d.bookings.filter((b) => b.payment_status === "completed");
    const revenue = paid.reduce((sum, b) => sum + Number(b.final_amount ?? b.amount ?? 0), 0);
    const pendingOrders = d.bookings.filter(
      (b) => b.status === "new" || b.status === "accepted" || b.status === "preparing",
    ).length;
    const dues = d.customers.filter((c) => c.payment_status === "pending").length;
    return { revenue, pendingOrders, dues, published: d.listings.filter((l) => l.status === "published").length };
  }, [data]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-xl font-semibold">Sign in to manage your business</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You need an account to access the owner dashboard.
        </p>
        <Button className="mt-6" onClick={() => void navigate({ to: "/auth" })}>
          Go to sign in
        </Button>
      </div>
    );
  }

  if (role !== "owner") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Building2 className="mx-auto h-14 w-14 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Become an owner</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set up your business profile to list places &amp; services and start receiving orders.
        </p>
        <Button
          className="mt-6"
          onClick={async () => {
            try {
              await supabase.from("user_roles").insert({ user_id: user.id, role: "owner" });
              await supabase.from("profiles").update({ needs_onboarding: true }).eq("id", user.id);
              void navigate({ to: "/onboarding" });
            } catch {
              void navigate({ to: "/onboarding" });
            }
          }}
        >
          Start onboarding <ArrowRight />
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-sm text-muted-foreground">
        Loading your dashboard…
      </div>
    );
  }

  const { biz, categories, amenities, listings, bookings, customers, ledger, expenses } = data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            {biz?.display_name ? `${biz.display_name}'s Dashboard` : "Owner Dashboard"}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {biz?.business_name ?? "Complete your business profile"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!biz?.onboarding_complete ? (
            <Button variant="outline" size="sm" onClick={() => void navigate({ to: "/onboarding" })}>
              Finish setup
            </Button>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => void loadAll()} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="mt-5 flex gap-1.5 overflow-x-auto rounded-full border border-border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id ? "brand-gradient text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <AppIcon name={t.icon} className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <OverviewTab
          stats={stats!}
          listings={listings}
          bookings={bookings}
          onOpenTab={setTab}
          onNewListing={() => {
            setEditor(EMPTY_EDITOR);
            setTab("listings");
          }}
        />
      ) : null}

      {tab === "listings" ? (
        <ListingsTab
          listings={listings}
          categories={categories}
          amenities={amenities}
          editor={editor}
          setEditor={setEditor}
          saving={savingListing}
          setSaving={setSavingListing}
          onSaved={() => void loadAll()}
        />
      ) : null}

      {tab === "bookings" ? (
        <BookingsTab bookings={bookings} onChanged={() => void loadAll()} />
      ) : null}

      {tab === "customers" ? (
        <CustomersTab customers={customers} onChanged={() => void loadAll()} />
      ) : null}

      {tab === "finance" ? (
        <FinanceTab ledger={ledger} expenses={expenses} onChanged={() => void loadAll()} />
      ) : null}
    </div>
  );
}

function OverviewTab({
  stats,
  listings,
  bookings,
  onOpenTab,
  onNewListing,
}: {
  stats: { revenue: number; pendingOrders: number; dues: number; published: number };
  listings: MyListing[];
  bookings: MyBooking[];
  onOpenTab: (t: TabId) => void;
  onNewListing: () => void;
}) {
  const cards = [
    { label: "Revenue (paid)", value: inr(stats.revenue), icon: "wallet", tab: "finance" as TabId },
    { label: "Pending orders", value: String(stats.pendingOrders), icon: "bookings", tab: "bookings" as TabId },
    { label: "Customer dues", value: String(stats.dues), icon: "profile", tab: "customers" as TabId },
    { label: "Published", value: String(stats.published), icon: "my-listings", tab: "listings" as TabId },
  ];
  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => onOpenTab(c.tab)}
            className="rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
          >
            <AppIcon name={c.icon} className="h-7 w-7" />
            <p className="mt-3 text-2xl font-bold">{c.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{c.label}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Recent activity</h2>
        <Button size="sm" onClick={onNewListing}>
          <Plus /> New listing
        </Button>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
          <AppIcon name="add-property" className="mx-auto h-12 w-12 opacity-70" />
          <p className="mt-3 text-sm font-medium">No listings yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Publish your first listing to start receiving bookings.
          </p>
          <Button className="mt-4" size="sm" onClick={onNewListing}>
            Create your first listing
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {bookings.slice(0, 5).map((b) => (
            <div
              key={b.id}
              className="flex flex-wrap items-center gap-3 border-b border-border p-4 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {b.listings?.title ?? "Listing"} · {b.quantity}×
                </p>
                <p className="text-xs text-muted-foreground">{fmtDate(b.created_at)}</p>
              </div>
              <StatusBadge status={b.status} />
              <PaymentBadge status={b.payment_status} />
              <p className="text-sm font-bold">{inr(b.final_amount ?? b.amount)}</p>
            </div>
          ))}
          {bookings.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No bookings yet — share your listing link to get orders.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ListingsTab({
  listings,
  categories,
  amenities,
  editor,
  setEditor,
  saving,
  setSaving,
  onSaved,
}: {
  listings: MyListing[];
  categories: CategoryRow[];
  amenities: AmenityRow[];
  editor: EditorState;
  setEditor: React.Dispatch<React.SetStateAction<EditorState>>;
  saving: boolean;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
  onSaved: () => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  function openNew() {
    setEditor(EMPTY_EDITOR);
  }

  function openEdit(l: MyListing) {
    setEditor({
      editingId: l.id,
      title: l.title,
      description: l.description ?? "",
      price: l.price_current != null ? String(l.price_current) : "",
      price_unit: l.price_unit ?? "month",
      gender: l.gender_preference ?? "any",
      address: l.address ?? "",
      city: l.city ?? "",
      locality: l.locality ?? "",
      state: l.state ?? "",
      pincode: l.pincode ?? "",
      phone: l.phone ?? "",
      whatsapp: l.whatsapp ?? "",
      amenityIds: [],
      coverFile: null,
      galleryFiles: [],
    });
  }

  async function saveListing(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      let id = editor.editingId;
      if (id) {
        await updateListing(id, {
          title: editor.title,
          description: editor.description || null,
          price_current: editor.price ? Number(editor.price) : null,
          price_unit: editor.price_unit,
          gender_preference: editor.gender,
          address: editor.address || null,
          city: editor.city || null,
          locality: editor.locality || null,
          state: editor.state || null,
          pincode: editor.pincode || null,
          phone: editor.phone || null,
          whatsapp: editor.whatsapp || null,
        });
      } else {
        const cat = categories[0];
        if (!cat) {
          toast.error("No categories available yet");
          return;
        }
        const row = await createListing({
          owner_id: user.id,
          category_id: cat.id,
          title: editor.title,
          description: editor.description || null,
          price_current: editor.price ? Number(editor.price) : null,
          price_unit: editor.price_unit,
          gender_preference: editor.gender,
          address: editor.address || null,
          city: editor.city || null,
          locality: editor.locality || null,
          state: editor.state || null,
          pincode: editor.pincode || null,
          phone: editor.phone || null,
          whatsapp: editor.whatsapp || null,
        });
        id = row.id;
      }
      await setListingAmenities(id, editor.amenityIds);
      if (editor.coverFile) {
        await uploadListingMedia(id, user.id, editor.coverFile, { isCover: true });
      }
      for (const file of editor.galleryFiles) {
        await uploadListingMedia(id, user.id, file, { isCover: false });
      }
      toast.success(editor.editingId ? "Listing updated" : "Listing published");
      setEditor(EMPTY_EDITOR);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save listing");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {listings.length} listing{listings.length === 1 ? "" : "s"}
        </p>
        <Button size="sm" onClick={openNew}>
          <Plus /> Add listing
        </Button>
      </div>

      {editor.editingId !== null || editor.title || editor.editingId === null && listings.length === 0 && editor.title === "" && false ? null : null}

      {listings.length === 0 && !editor.title && editor.editingId === null ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
          <AppIcon name="add-property" className="mx-auto h-12 w-12 opacity-70" />
          <p className="mt-3 text-sm font-medium">You have no listings yet</p>
          <Button className="mt-4" size="sm" onClick={openNew}>
            <Plus /> Create your first listing
          </Button>
        </div>
      ) : null}

      {listings.map((l) => (
        <div
          key={l.id}
          className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4"
        >
          <ListingCover listing={l} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <AppIcon name={CATEGORY_ICON[l.categories?.slug ?? ""] ?? "home"} className="h-4 w-4 shrink-0 text-primary" />
              <p className="truncate text-sm font-semibold">{l.title}</p>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {l.city || l.locality || "No location"} ·{" "}
              <span className="font-semibold text-foreground">{inr(l.price_current)}</span>/
              {l.price_unit ?? "month"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={l.status} />
              <span className="text-xs text-muted-foreground">
                {l.listing_media?.length ?? 0} photo{(l.listing_media?.length ?? 0) === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => openEdit(l)}>
              <Pencil /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await setListingStatus(l.id, l.status === "published" ? "suspended" : "published");
                onSaved();
              }}
            >
              {l.status === "published" ? "Pause" : "Publish"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={async () => {
                if (!window.confirm(`Delete "${l.title}"? This cannot be undone.`)) return;
                try {
                  await supabase.from("listings").delete().eq("id", l.id);
                  toast.success("Listing deleted");
                  onSaved();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not delete listing");
                }
              }}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      ))}

      {editor.editingId !== null || editor.title !== "" ? (
        <form onSubmit={saveListing} className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <h3 className="font-semibold">{editor.editingId ? "Edit listing" : "New listing"}</h3>
          <div className="space-y-1.5">
            <Label htmlFor="ed-title">Title *</Label>
            <Input
              id="ed-title"
              value={editor.title}
              onChange={(e) => setEditor((s) => ({ ...s, title: e.target.value }))}
              placeholder="e.g. Sunrise Library — AC study hall"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ed-price">Price (₹) *</Label>
              <Input
                id="ed-price"
                type="number"
                min={0}
                value={editor.price}
                onChange={(e) => setEditor((s) => ({ ...s, price: e.target.value }))}
                placeholder="1500"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Per</Label>
              <Select
                value={editor.price_unit}
                onValueChange={(v) => setEditor((s) => ({ ...s, price_unit: v }))}
              >
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ed-city">City</Label>
              <Input
                id="ed-city"
                value={editor.city}
                onChange={(e) => setEditor((s) => ({ ...s, city: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ed-loc">Locality</Label>
              <Input
                id="ed-loc"
                value={editor.locality}
                onChange={(e) => setEditor((s) => ({ ...s, locality: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ed-state">State</Label>
              <Input
                id="ed-state"
                value={editor.state}
                onChange={(e) => setEditor((s) => ({ ...s, state: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ed-pin">PIN code</Label>
              <Input
                id="ed-pin"
                value={editor.pincode}
                onChange={(e) => setEditor((s) => ({ ...s, pincode: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ed-addr">Address</Label>
            <Input
              id="ed-addr"
              value={editor.address}
              onChange={(e) => setEditor((s) => ({ ...s, address: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ed-phone">Phone</Label>
              <Input
                id="ed-phone"
                value={editor.phone}
                onChange={(e) => setEditor((s) => ({ ...s, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ed-wa">WhatsApp</Label>
              <Input
                id="ed-wa"
                value={editor.whatsapp}
                onChange={(e) => setEditor((s) => ({ ...s, whatsapp: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ed-desc">Description</Label>
            <Textarea
              id="ed-desc"
              value={editor.description}
              onChange={(e) => setEditor((s) => ({ ...s, description: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Amenities</Label>
            <div className="flex flex-wrap gap-2">
              {amenities.map((a) => {
                const on = editor.amenityIds.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() =>
                      setEditor((s) => ({
                        ...s,
                        amenityIds: on
                          ? s.amenityIds.filter((id) => id !== a.id)
                          : [...s.amenityIds, a.id],
                      }))
                    }
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
                      on
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    <AppIcon name={a.icon ?? "bookmark"} className="h-4 w-4" />
                    {a.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>New cover photo</Label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground hover:bg-accent">
                <AppIcon name="gallery" className="h-6 w-6" />
                {editor.coverFile ? editor.coverFile.name : "Choose file"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    setEditor((s) => ({ ...s, coverFile: e.target.files?.[0] ?? null }))
                  }
                />
              </label>
            </div>
            <div className="space-y-2">
              <Label>Add gallery photos</Label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground hover:bg-accent">
                <AppIcon name="gallery" className="h-6 w-6" />
                {editor.galleryFiles.length > 0
                  ? `${editor.galleryFiles.length} file(s)`
                  : "Choose files"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) =>
                    setEditor((s) => ({
                      ...s,
                      galleryFiles: Array.from(e.target.files ?? []),
                    }))
                  }
                />
              </label>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditor(EMPTY_EDITOR)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : null}
              {editor.editingId ? "Save changes" : "Publish listing"}
            </Button>
          </div>
        </form>
      ) : null}

      <p className="pt-2 text-center text-xs text-muted-foreground">
        View your public page:{" "}
        <button
          type="button"
          className="font-medium text-primary underline"
          onClick={() => {
            const l = listings[0];
            if (l) void navigate({ to: "/listing/$slug", params: { slug: l.slug } });
          }}
        >
          open listing page
        </button>
      </p>
    </div>
  );
}

function ListingCover({ listing }: { listing: MyListing }) {
  const { data: url } = useQuery<{ url: string | null }>({
    queryKey: ["signed-cover", listing.id, listing.cover_url],
    queryFn: async () => ({
      url: listing.cover_url ? await signedMediaUrl(listing.cover_url) : null,
    }),
  });
  if (url?.url) {
    return (
      <img src={url.url} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" loading="lazy" />
    );
  }
  return (
    <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-muted">
      <AppIcon name={CATEGORY_ICON[listing.categories?.slug ?? ""] ?? "home"} className="h-8 w-8 opacity-60" />
    </div>
  );
}

function BookingsTab({
  bookings,
  onChanged,
}: {
  bookings: MyBooking[];
  onChanged: () => void;
}) {
  return (
    <div className="mt-6 space-y-3">
      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          No bookings yet.
        </div>
      ) : null}
      {bookings.map((b) => (
        <div
          key={b.id}
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {b.listings?.title ?? "Listing"} · {b.quantity}×
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {fmtDate(b.created_at)}
              {b.start_date ? ` · ${b.start_date}` : ""}
              {b.contact_phone ? ` · ${b.contact_phone}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Select
                value={b.status}
                onValueChange={async (v) => {
                  await updateBookingStatus(b.id, v as MyBooking["status"]);
                  onChanged();
                }}
              >
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={b.payment_status}
                onValueChange={async (v) => {
                  await updateBookingPayment(b.id, v as MyBooking["payment_status"]);
                  onChanged();
                }}
              >
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">pending</SelectItem>
                  <SelectItem value="completed">completed</SelectItem>
                  <SelectItem value="failed">failed</SelectItem>
                  <SelectItem value="refunded">refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-base font-bold">{inr(b.final_amount ?? b.amount)}</p>
        </div>
      ))}
    </div>
  );
}

function CustomersTab({
  customers,
  onChanged,
}: {
  customers: CustomerRow[];
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("stay");
  const [plan, setPlan] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("active");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    try {
      await addCustomer({
        owner_id: user.id,
        name,
        phone: phone || null,
        customer_type: type,
        plan_name: plan || null,
        payment_status: amount ? "pending" : "completed",
        status,
      });
      setName("");
      setPhone("");
      setPlan("");
      setAmount("");
      setStatus("active");
      setOpen(false);
      onChanged();
      toast.success("Customer added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add customer");
    }
  }

  async function markPaid(c: CustomerRow) {
    await updateCustomer(c.id, { payment_status: "completed" });
    onChanged();
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{customers.length} customers</p>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus /> Add customer
        </Button>
      </div>

      {open ? (
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cu-name">Name *</Label>
            <Input id="cu-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cu-phone">Phone</Label>
            <Input id="cu-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stay">Staying</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="order">Order</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cu-plan">Plan / item</Label>
            <Input id="cu-plan" value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="Monthly AC seat" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cu-amount">Outstanding amount (₹)</Label>
            <Input id="cu-amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit" className="flex-1">
              Add
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {customers.map((c) => (
        <div
          key={c.id}
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{c.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {c.customer_type} · {c.plan_name ?? "—"}
              {c.phone ? ` · ${c.phone}` : ""}
            </p>
          </div>
          <PaymentBadge status={c.payment_status} />
          {c.payment_status === "pending" ? (
            <Button size="sm" variant="outline" onClick={() => void markPaid(c)}>
              Mark paid
            </Button>
          ) : null}
          <p className="text-sm font-bold">{inr(c.next_renewal ? 0 : 0)}</p>
        </div>
      ))}
    </div>
  );
}

function FinanceTab({
  ledger,
  expenses,
  onChanged,
}: {
  ledger: MyLedger[];
  expenses: ExpenseRow[];
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const [mode, setMode] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("rent");
  const [description, setDescription] = useState("");
  const [method, setMethod] = useState("cash");
  const [busy, setBusy] = useState(false);

  const balance = ledger.reduce((sum, l) => {
    const amt = Number(l.amount);
    return l.kind === "expense" || l.kind === "debit" ? sum - amt : sum + amt;
  }, 0);

  const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalIncome = ledger
    .filter((l) => l.kind === "income" || l.kind === "credit")
    .reduce((s, l) => s + Number(l.amount), 0);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user || !amount) return;
    setBusy(true);
    try {
      if (mode === "income") {
        await addLedgerEntry({
          owner_id: user.id,
          entry_date: date || new Date().toISOString().slice(0, 10),
          kind: "income",
          category: category === "rent" ? "rent" : category,
          description: description || null,
          amount: Number(amount),
          method: method as (typeof PAY_METHODS)[number],
        });
      } else {
        await addExpense({
          owner_id: user.id,
          expense_date: date || new Date().toISOString().slice(0, 10),
          category,
          description: description || null,
          amount: Number(amount),
          method: method as (typeof PAY_METHODS)[number],
        });
      }
      setAmount("");
      setDescription("");
      setDate("");
      onChanged();
      toast.success(mode === "income" ? "Income added" : "Expense added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save entry");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Balance</p>
          <p className={cn("mt-1 text-lg font-bold", balance >= 0 ? "text-success" : "text-destructive")}>
            {inr(balance)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Income</p>
          <p className="mt-1 text-lg font-bold text-success">{inr(totalIncome)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Expenses</p>
          <p className="mt-1 text-lg font-bold text-destructive">{inr(totalExpense)}</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={mode === "income" ? "default" : "outline"}
            onClick={() => setMode("income")}
          >
            + Income
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "expense" ? "default" : "outline"}
            onClick={() => setMode("expense")}
          >
            − Expense
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="fn-amt">Amount (₹) *</Label>
            <Input id="fn-amt" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fn-date">Date</Label>
            <Input id="fn-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            {mode === "income" ? (
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="booking">Booking</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="electricity">Electricity</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="misc">Misc</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAY_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fn-desc">Description</Label>
          <Input
            id="fn-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={mode === "income" ? "e.g. March rent — Seat 12" : "e.g. Electricity bill"}
          />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : null}
          Add {mode}
        </Button>
      </form>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Recent ledger</h3>
        {ledger.slice(0, 20).map((l) => (
          <div
            key={l.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
          >
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                l.kind === "income" || l.kind === "credit"
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {l.kind}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{l.description ?? l.category ?? "Entry"}</p>
              <p className="text-xs text-muted-foreground">{l.entry_date ?? fmtDate(l.created_at)}</p>
            </div>
            <p
              className={cn(
                "text-sm font-bold",
                l.kind === "income" || l.kind === "credit" ? "text-success" : "text-destructive",
              )}
            >
              {l.kind === "income" || l.kind === "credit" ? "+" : "−"}
              {inr(l.amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: "bg-success/10 text-success",
    new: "bg-primary/10 text-primary",
    accepted: "bg-primary/10 text-primary",
    preparing: "bg-warning/10 text-warning",
    ready: "bg-warning/10 text-warning",
    out_for_delivery: "bg-warning/10 text-warning",
    delivered: "bg-success/10 text-success",
    completed: "bg-success/10 text-success",
    cancelled: "bg-destructive/10 text-destructive",
    pending: "bg-warning/10 text-warning",
    suspended: "bg-destructive/10 text-destructive",
    rejected: "bg-destructive/10 text-destructive",
    draft: "bg-muted text-muted-foreground",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", styles[status] ?? "bg-muted text-muted-foreground")}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-success/10 text-success",
    pending: "bg-warning/10 text-warning",
    failed: "bg-destructive/10 text-destructive",
    refunded: "bg-muted text-muted-foreground",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", styles[status] ?? "bg-muted text-muted-foreground")}>
      {status.replace(/_/g, " ")}
    </span>
  );
}