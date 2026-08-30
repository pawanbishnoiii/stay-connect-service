import { supabase } from "@/integrations/supabase/client";

export type AdminUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  created_at: string;
  last_seen_at: string | null;
  total_seconds: number;
  role: "admin" | "owner" | "user" | "vendor";
};

export type AdminListing = {
  id: string;
  title: string;
  slug: string;
  city: string | null;
  status: string;
  verification: string;
  is_featured: boolean;
  owner_id: string;
  created_at: string;
};

export async function fetchAdminUsers(search = ""): Promise<AdminUser[]> {
  let q = supabase
    .from("profiles")
    .select("id, full_name, email, phone, city, avatar_url, created_at, last_seen_at, total_seconds")
    .order("created_at", { ascending: false })
    .limit(200);
  if (search.trim()) q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  const { data, error } = await q;
  if (error) throw error;

  const ids = (data ?? []).map((p) => p.id);
  const roles = ids.length
    ? (await supabase.from("user_roles").select("user_id, role").in("user_id", ids)).data ?? []
    : [];
  const rank: Record<string, number> = { admin: 3, owner: 2, vendor: 2, user: 1 };
  const map = new Map<string, AdminUser["role"]>();
  for (const r of roles) {
    const cur = map.get(r.user_id);
    const next = r.role as AdminUser["role"];
    if (!cur || (rank[next] ?? 0) > (rank[cur] ?? 0)) map.set(r.user_id, next);
  }

  return (data ?? []).map((p) => ({
    ...p,
    total_seconds: p.total_seconds ?? 0,
    role: map.get(p.id) ?? "user",
  })) as AdminUser[];
}

export async function setUserRole(userId: string, role: "admin" | "owner" | "user") {
  const { error: del } = await supabase.from("user_roles").delete().eq("user_id", userId);
  if (del) throw del;
  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
  if (error) throw error;
}

export async function fetchAdminListings(search = ""): Promise<AdminListing[]> {
  let q = supabase
    .from("listings")
    .select("id, title, slug, city, status, verification, is_featured, owner_id, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (search.trim()) q = q.ilike("title", `%${search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AdminListing[];
}

export async function moderateListing(
  id: string,
  patch: { status?: string; verification?: string; is_featured?: boolean },
) {
  const { error } = await supabase
    .from("listings")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(patch as any)
    .eq("id", id);
  if (error) throw error;
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const { data } = await supabase.from("admin_settings").select("value").eq("key", key).maybeSingle();
  return ((data?.value as T | undefined) ?? fallback) as T;
}

export async function saveSetting(key: string, value: unknown) {
  const { error } = await supabase
    .from("admin_settings")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert({ key, value: value as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw error;
}

export function humanTime(seconds: number) {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function timeAgo(iso: string | null) {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "online now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
