import { supabase } from "@/integrations/supabase/client";

export type ActivityKind = "order" | "booking" | "visit" | "enquiry";

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  title: string;
  slug: string | null;
  cover_url: string | null;
  status: string;
  amount?: number | null;
  when: string | null;
  createdAt: string;
};

type ListingRef = { title: string; slug: string; cover_url: string | null } | null;

/**
 * Everything the signed-in user has going on right now — orders, bookings,
 * scheduled visits and enquiries — newest first, for the home page card rail.
 */
export async function fetchMyActivity(userId: string): Promise<ActivityItem[]> {
  const [bookings, visits, enquiries] = await Promise.all([
    supabase
      .from("listing_bookings")
      .select(
        "id, booking_type, status, final_amount, start_date, scheduled_at, created_at, listings:listing_id ( title, slug, cover_url )",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("listing_visits")
      .select(
        "id, status, mode, visit_date, visit_time, created_at, listings:listing_id ( title, slug, cover_url )",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("enquiries")
      .select("id, status, created_at, listings:listing_id ( title, slug, cover_url )")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const items: ActivityItem[] = [];

  for (const b of (bookings.data ?? []) as unknown as Array<{
    id: string;
    booking_type: string;
    status: string;
    final_amount: number | null;
    start_date: string | null;
    scheduled_at: string | null;
    created_at: string;
    listings: ListingRef;
  }>) {
    items.push({
      id: b.id,
      kind: b.booking_type === "order" ? "order" : "booking",
      title: b.listings?.title ?? "Listing",
      slug: b.listings?.slug ?? null,
      cover_url: b.listings?.cover_url ?? null,
      status: b.status,
      amount: b.final_amount,
      when: b.start_date ?? b.scheduled_at,
      createdAt: b.created_at,
    });
  }

  for (const v of (visits.data ?? []) as unknown as Array<{
    id: string;
    status: string;
    mode: string;
    visit_date: string;
    visit_time: string | null;
    created_at: string;
    listings: ListingRef;
  }>) {
    items.push({
      id: v.id,
      kind: "visit",
      title: v.listings?.title ?? "Listing",
      slug: v.listings?.slug ?? null,
      cover_url: v.listings?.cover_url ?? null,
      status: `${v.status} · ${v.mode}`,
      when: v.visit_time ? `${v.visit_date} ${v.visit_time}` : v.visit_date,
      createdAt: v.created_at,
    });
  }

  for (const e of (enquiries.data ?? []) as unknown as Array<{
    id: string;
    status: string;
    created_at: string;
    listings: ListingRef;
  }>) {
    items.push({
      id: e.id,
      kind: "enquiry",
      title: e.listings?.title ?? "Listing",
      slug: e.listings?.slug ?? null,
      cover_url: e.listings?.cover_url ?? null,
      status: e.status,
      when: null,
      createdAt: e.created_at,
    });
  }

  return items
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);
}
