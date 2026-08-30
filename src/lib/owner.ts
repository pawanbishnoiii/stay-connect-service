import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];

export type ListingRow = Tables["listings"]["Row"];
export type BookingRow = Tables["listing_bookings"]["Row"];
export type CustomerRow = Tables["business_customers"]["Row"];
export type LedgerRow = Tables["ledger_entries"]["Row"];
export type ExpenseRow = Tables["expenses"]["Row"];
export type MediaRow = Tables["listing_media"]["Row"];
export type AmenityRow = Tables["amenities"]["Row"];
export type BusinessRow = Tables["business_profiles"]["Row"];
export type CategoryRow = Tables["categories"]["Row"];
export type NotificationPrefsRow = Tables["notification_preferences"]["Row"];

export type MyListing = ListingRow & {
  categories: { slug: string | null; name: string | null } | null;
  listing_media: MediaRow[] | null;
};

export type MyBooking = BookingRow & {
  listings: Pick<ListingRow, "id" | "title" | "slug" | "cover_url"> | null;
};

export type MyLedger = LedgerRow & {
  customers: { id: string; name: string } | null;
};

const MEDIA_BUCKET = "listing-media";

/* ---------------- business profile ---------------- */

export async function fetchMyBusiness(userId: string): Promise<BusinessRow | null> {
  const { data, error } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertBusiness(patch: Partial<BusinessRow> & { user_id: string }) {
  const { error } = await supabase
    .from("business_profiles")
    .upsert(patch as unknown as Tables["business_profiles"]["Insert"]);
  if (error) throw error;
}

/* ---------------- catalogs ---------------- */

export async function fetchCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAmenities(): Promise<AmenityRow[]> {
  const { data, error } = await supabase
    .from("amenities")
    .select("*")
    .eq("is_active", true)
    .order("group_name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/* ---------------- listings ---------------- */

export async function fetchMyListings(userId: string): Promise<MyListing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select(
      "*, categories:category_id (slug, name), listing_media (id, url, is_cover, sort_order, caption)",
    )
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MyListing[];
}

export type ListingInput = {
  owner_id: string;
  category_id: string;
  title: string;
  description?: string | null;
  price_current?: number | null;
  price_unit?: string;
  gender_preference?: string;
  address?: string | null;
  city?: string | null;
  locality?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
};

export async function createListing(input: ListingInput): Promise<ListingRow> {
  const { data, error } = await supabase
    .from("listings")
    .insert({
      owner_id: input.owner_id,
      category_id: input.category_id,
      title: input.title,
      slug: "", // the database trigger generates it from the title
      description: input.description ?? null,
      price_current: input.price_current ?? null,
      price_unit: input.price_unit ?? "month",
      gender_preference: input.gender_preference ?? "any",
      address: input.address ?? null,
      city: input.city ?? null,
      locality: input.locality ?? null,
      state: input.state ?? null,
      pincode: input.pincode ?? null,
      phone: input.phone ?? null,
      whatsapp: input.whatsapp ?? null,
      status: "published",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateListing(id: string, patch: Partial<ListingRow>) {
  const { error } = await supabase.from("listings").update(patch).eq("id", id);
  if (error) throw error;
}

export async function setListingStatus(id: string, status: ListingRow["status"]) {
  await updateListing(id, { status });
}

export async function setListingAmenities(listingId: string, amenityIds: string[]) {
  const { error: del } = await supabase
    .from("listing_amenities")
    .delete()
    .eq("listing_id", listingId);
  if (del) throw del;
  if (amenityIds.length === 0) return;
  const { error } = await supabase
    .from("listing_amenities")
    .insert(amenityIds.map((amenity_id) => ({ listing_id: listingId, amenity_id })));
  if (error) throw error;
}

export async function uploadListingMedia(
  listingId: string,
  ownerId: string,
  file: File,
  { isCover = false, caption }: { isCover?: boolean; caption?: string } = {},
): Promise<MediaRow> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${ownerId}/${listingId}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
  if (upErr) throw upErr;
  const { data, error } = await supabase
    .from("listing_media")
    .insert({
      listing_id: listingId,
      url: path,
      media_type: "image",
      is_cover: isCover,
      sort_order: 0,
      caption: caption ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  if (isCover) {
    await supabase.from("listings").update({ cover_url: path }).eq("id", listingId);
  }
  return data;
}

export async function deleteListingMedia(mediaId: string) {
  const { error } = await supabase.from("listing_media").delete().eq("id", mediaId);
  if (error) throw error;
}

const signedCache = new Map<string, Promise<string | null>>();

export function signedMediaUrl(path: string | null, ttlSeconds = 3600): Promise<string | null> {
  if (!path) return Promise.resolve(null);
  if (path.startsWith("http")) return Promise.resolve(path);
  if (!signedCache.has(path)) {
    signedCache.set(
      path,
      supabase.storage
        .from(MEDIA_BUCKET)
        .createSignedUrl(path, ttlSeconds)
        .then(({ data }) => data?.signedUrl ?? null),
    );
  }
  return signedCache.get(path)!;
}

/* ---------------- bookings ---------------- */

export async function fetchMyBookings(userId: string): Promise<MyBooking[]> {
  const { data, error } = await supabase
    .from("listing_bookings")
    .select("*, listings:listing_id (id, title, slug, cover_url)")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;
  return (data ?? []) as MyBooking[];
}

export async function updateBookingStatus(id: string, status: BookingRow["status"]) {
  const { error } = await supabase.from("listing_bookings").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function updateBookingPayment(id: string, payment_status: BookingRow["payment_status"]) {
  const { error } = await supabase
    .from("listing_bookings")
    .update({ payment_status })
    .eq("id", id);
  if (error) throw error;
}

/* ---------------- customers ---------------- */

export async function fetchMyCustomers(userId: string): Promise<CustomerRow[]> {
  const { data, error } = await supabase
    .from("business_customers")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function addCustomer(input: {
  owner_id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  customer_type: string;
  plan_name?: string | null;
  room_label?: string | null;
  bed_label?: string | null;
  payment_status: CustomerRow["payment_status"];
  status?: string;
  notes?: string | null;
}) {
  const { error } = await supabase.from("business_customers").insert({
    owner_id: input.owner_id,
    name: input.name,
    phone: input.phone ?? null,
    email: input.email ?? null,
    customer_type: input.customer_type,
    plan_name: input.plan_name ?? null,
    room_label: input.room_label ?? null,
    bed_label: input.bed_label ?? null,
    payment_status: input.payment_status,
    status: input.status ?? "active",
    notes: input.notes ?? null,
  });
  if (error) throw error;
}

export async function updateCustomer(id: string, patch: Partial<CustomerRow>) {
  const { error } = await supabase.from("business_customers").update(patch).eq("id", id);
  if (error) throw error;
}

/* ---------------- finance ---------------- */

export async function fetchLedger(userId: string): Promise<MyLedger[]> {
  const { data, error } = await supabase
    .from("ledger_entries")
    .select("*, customers:customer_id (id, name)")
    .eq("owner_id", userId)
    .order("entry_date", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as MyLedger[];
}

export async function addLedgerEntry(input: {
  owner_id: string;
  kind: LedgerRow["kind"];
  amount: number;
  entry_date: string;
  category?: string | null;
  description?: string | null;
  method?: LedgerRow["method"];
}) {
  const { error } = await supabase.from("ledger_entries").insert({
    owner_id: input.owner_id,
    kind: input.kind,
    amount: input.amount,
    entry_date: input.entry_date,
    category: input.category ?? null,
    description: input.description ?? null,
    method: input.method ?? null,
  });
  if (error) throw error;
}

export async function fetchExpenses(userId: string): Promise<ExpenseRow[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("owner_id", userId)
    .order("expense_date", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function addExpense(input: {
  owner_id: string;
  amount: number;
  category: string;
  expense_date: string;
  description?: string | null;
  method?: ExpenseRow["method"];
}) {
  const { error } = await supabase.from("expenses").insert({
    owner_id: input.owner_id,
    amount: input.amount,
    category: input.category,
    expense_date: input.expense_date,
    description: input.description ?? null,
    method: input.method ?? null,
  });
  if (error) throw error;
}

/* ---------------- notifications ---------------- */

export async function setNotificationPrefs(
  userId: string,
  prefs: Partial<Omit<NotificationPrefsRow, "user_id" | "updated_at">>,
) {
  const { error } = await supabase
    .from("notification_preferences")
    .upsert({ user_id: userId, ...prefs });
  if (error) throw error;
}

/* ---------------- helpers ---------------- */

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const ORDER_STATES = [
  "new",
  "accepted",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "completed",
  "cancelled",
] as const;

export const PAY_METHODS = ["cash", "upi", "bank_transfer", "online", "manual"] as const;