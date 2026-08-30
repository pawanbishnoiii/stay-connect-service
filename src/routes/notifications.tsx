import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications & Alerts — LocalSpot" },
      {
        name: "description",
        content: "Booking updates, offers and alerts for new services near you, with full control over what you receive.",
      },
      { property: "og:title", content: "Notifications — LocalSpot" },
      { property: "og:description", content: "Booking updates, offers and nearby service alerts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationsPage,
});

type Prefs = {
  push_enabled: boolean;
  bookings: boolean;
  payments: boolean;
  reviews: boolean;
  offers: boolean;
  nearby: boolean;
  saved_search: boolean;
};

const PREF_ROWS: Array<{ key: keyof Prefs; label: string; sub: string }> = [
  { key: "push_enabled", label: "Push notifications", sub: "Master switch for this device" },
  { key: "nearby", label: "New services near me", sub: "When a new place opens around you" },
  { key: "saved_search", label: "Saved search matches", sub: "New listings matching your searches" },
  { key: "bookings", label: "Bookings & orders", sub: "Status updates from owners" },
  { key: "payments", label: "Payments", sub: "Rent, dues and receipts" },
  { key: "offers", label: "Offers & discounts", sub: "Deals from places you follow" },
  { key: "reviews", label: "Reviews", sub: "Replies to your reviews" },
];

function NotificationsPage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();

  const notifications = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const prefs = useQuery({
    queryKey: ["notification-prefs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return (data as Prefs | null) ?? null;
    },
  });

  const savePref = useMutation({
    mutationFn: async (patch: Partial<Prefs>) => {
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({ user_id: user!.id, ...prefs.data, ...patch }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notification-prefs", user?.id] }),
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });

  async function enablePush() {
    if (!("Notification" in window)) return;
    if (window.top !== window.self) {
      window.alert("Open LocalSpot in its own browser tab to allow notifications.");
      return;
    }
    const permission =
      Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    savePref.mutate({ push_enabled: permission === "granted" });
  }

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Bell className="mx-auto h-9 w-9 text-primary" />
        <h1 className="mt-3 text-lg font-bold">Sign in for notifications</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Get alerts for new services near you and booking updates.
        </p>
        <Link
          to="/auth"
          className="mt-5 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const list = notifications.data ?? [];
  const p = prefs.data;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">Updates, offers and nearby alerts</p>
        </div>
        <button
          type="button"
          onClick={() => void enablePush()}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
        >
          <BellRing className="h-4 w-4" /> Enable alerts
        </button>
      </div>

      <section className="space-y-2">
        {notifications.isPending ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
          ))
        ) : list.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            You're all caught up.
          </p>
        ) : (
          list.map((n) => (
            <article
              key={n.id}
              className={cn(
                "flex items-start gap-3 rounded-2xl border p-3.5",
                n.is_read ? "border-border bg-card" : "border-primary/30 bg-primary/5",
              )}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Bell className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              {!n.is_read ? (
                <button
                  type="button"
                  onClick={() => markRead.mutate(n.id)}
                  className="shrink-0 text-primary"
                  aria-label="Mark as read"
                >
                  <Check className="h-4 w-4" />
                </button>
              ) : null}
            </article>
          ))
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-bold">Notification preferences</h2>
        <div className="mt-3 divide-y divide-border">
          {PREF_ROWS.map((row) => (
            <label key={row.key} className="flex cursor-pointer items-center justify-between gap-4 py-3">
              <span className="min-w-0">
                <span className="block text-sm font-medium">{row.label}</span>
                <span className="block text-xs text-muted-foreground">{row.sub}</span>
              </span>
              <input
                type="checkbox"
                className="h-5 w-5 shrink-0 accent-primary"
                checked={p ? Boolean(p[row.key]) : row.key !== "push_enabled"}
                onChange={(e) => savePref.mutate({ [row.key]: e.target.checked } as Partial<Prefs>)}
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
