import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Send, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { AppIcon } from "@/components/AppIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  fetchAdminUsers,
  fetchAdminListings,
  setUserRole,
  moderateListing,
  getSetting,
  saveSetting,
  humanTime,
  timeAgo,
} from "@/lib/admin";
import { sendAdminPush } from "@/lib/push.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — LocalSpot" },
      { name: "description", content: "Manage users, owners, listings, push notifications and platform settings on LocalSpot." },
      { property: "og:title", content: "Admin Console — LocalSpot" },
      { property: "og:description", content: "Platform administration for LocalSpot." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const TABS = [
  { id: "users", label: "Users", icon: "profile" },
  { id: "listings", label: "Listings", icon: "hostel" },
  { id: "push", label: "Push", icon: "notifications" },
  { id: "settings", label: "Settings", icon: "settings" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type PlatformSettings = {
  logo_url: string;
  brand_name: string;
  suggestion_same_pct: number;
};

type SupportAi = { prompt: string; prompts: string[] };

type Smtp = { host: string; port: string; user: string; from: string; enabled: boolean };

function AdminPage() {
  const { role, loading } = useAuth();
  const [tab, setTab] = useState<TabId>("users");

  if (loading) {
    return (
      <div className="grid h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Shield className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-3 text-lg font-bold">Admins only</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This console is limited to LocalSpot administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 py-5">
      <header>
        <h1 className="text-2xl font-extrabold">Admin console</h1>
        <p className="text-sm text-muted-foreground">Users, listings, push campaigns and platform settings.</p>
      </header>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold",
              tab === t.id ? "brand-gradient border-transparent text-primary-foreground" : "text-muted-foreground",
            )}
          >
            <AppIcon name={t.icon} className="h-5 w-5" />
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "users" ? <UsersTab /> : null}
      {tab === "listings" ? <ListingsTab /> : null}
      {tab === "push" ? <PushTab /> : null}
      {tab === "settings" ? <SettingsTab /> : null}
    </div>
  );
}

/* ------------------------------- users ------------------------------- */

function UsersTab() {
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const users = useQuery({ queryKey: ["admin-users", search], queryFn: () => fetchAdminUsers(search) });

  async function changeRole(id: string, role: "admin" | "owner" | "user") {
    try {
      await setUserRole(id, role);
      toast.success("Role updated");
      await qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update role");
    }
  }

  return (
    <section className="space-y-3">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, email or phone"
        className="max-w-sm"
      />
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Last seen</th>
              <th className="px-4 py-3">Time spent</th>
              <th className="px-4 py-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td>
              </tr>
            ) : (users.data ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No users found.</td>
              </tr>
            ) : (
              (users.data ?? []).map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <AppIcon name="profile" className="h-8 w-8" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium">{u.full_name || "Unnamed"}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.city ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <p>{u.email ?? "—"}</p>
                    <p>{u.phone ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{timeAgo(u.last_seen_at)}</td>
                  <td className="px-4 py-3 text-xs">{humanTime(u.total_seconds)}</td>
                  <td className="px-4 py-3">
                    <Select value={u.role === "vendor" ? "owner" : u.role} onValueChange={(v) => void changeRole(u.id, v as "admin" | "owner" | "user")}>
                      <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ------------------------------ listings ----------------------------- */

function ListingsTab() {
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const listings = useQuery({ queryKey: ["admin-listings", search], queryFn: () => fetchAdminListings(search) });

  async function patch(id: string, p: { status?: string; verification?: string; is_featured?: boolean }) {
    try {
      await moderateListing(id, p);
      toast.success("Listing updated");
      await qc.invalidateQueries({ queryKey: ["admin-listings"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update listing");
    }
  }

  return (
    <section className="space-y-3">
      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search listings" className="max-w-sm" />
      <div className="grid gap-3 md:grid-cols-2">
        {(listings.data ?? []).map((l) => (
          <article key={l.id} className="rounded-2xl border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-semibold">{l.title}</h3>
                <p className="text-xs text-muted-foreground">{l.city ?? "—"} · /{l.slug}</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span>Featured</span>
                <Switch checked={l.is_featured} onCheckedChange={(v) => void patch(l.id, { is_featured: v })} />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Select value={l.status} onValueChange={(v) => void patch(l.id, { status: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["draft", "pending", "published", "rejected", "suspended", "archived"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={l.verification} onValueChange={(v) => void patch(l.id, { verification: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["unverified", "pending", "verified"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </article>
        ))}
        {!listings.isLoading && (listings.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No listings found.</p>
        ) : null}
      </div>
    </section>
  );
}

/* -------------------------------- push ------------------------------- */

function PushTab() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [actionUrl, setActionUrl] = useState("");
  const [audience, setAudience] = useState<"all" | "self" | "city">("self");
  const [city, setCity] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message are required");
      return;
    }
    setSending(true);
    try {
      const res = await sendAdminPush({
        data: {
          title: title.trim(),
          body: body.trim(),
          actionUrl: actionUrl.trim() || undefined,
          audience,
          city: city.trim() || undefined,
          limit: 200,
        },
      });
      toast.success(`Sent to ${res.sent} device(s)${res.failed ? `, ${res.failed} failed` : ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Push failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-3 rounded-2xl border border-border p-4">
        <div className="space-y-1.5">
          <Label htmlFor="p-title">Title</Label>
          <Input id="p-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New PG near you" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-body">Message</Label>
          <Textarea id="p-body" value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="p-url">Action link</Label>
            <Input id="p-url" value={actionUrl} onChange={(e) => setActionUrl(e.target.value)} placeholder="/explore" />
          </div>
          <div className="space-y-1.5">
            <Label>Audience</Label>
            <Select value={audience} onValueChange={(v) => setAudience(v as typeof audience)}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="self">Test — only me</SelectItem>
                <SelectItem value="city">By city</SelectItem>
                <SelectItem value="all">Everyone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {audience === "city" ? (
          <div className="space-y-1.5">
            <Label htmlFor="p-city">City</Label>
            <Input id="p-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Jaipur" />
          </div>
        ) : null}
        <Button onClick={() => void send()} disabled={sending}>
          {sending ? <Loader2 className="animate-spin" /> : <Send className="h-4 w-4" />} Send push
        </Button>
      </div>

      <aside className="rounded-2xl border border-border p-4 text-center">
        <img src="/icons/push-card.png" alt="Push notifications" className="mx-auto h-40 w-40 object-contain" />
        <p className="text-sm font-semibold">Web push via Firebase</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Test with “only me” first — it uses your subscribed browser tokens.
        </p>
      </aside>
    </section>
  );
}

/* ------------------------------ settings ----------------------------- */

function SettingsTab() {
  const platform = useQuery({
    queryKey: ["admin-setting", "platform"],
    queryFn: () => getSetting<PlatformSettings>("platform", { logo_url: "", brand_name: "LocalSpot", suggestion_same_pct: 60 }),
  });
  const ai = useQuery({
    queryKey: ["admin-setting", "support_ai"],
    queryFn: () => getSetting<SupportAi>("support_ai", { prompt: "", prompts: [] }),
  });
  const smtp = useQuery({
    queryKey: ["admin-setting", "smtp"],
    queryFn: () => getSetting<Smtp>("smtp", { host: "", port: "587", user: "", from: "", enabled: false }),
  });

  const [p, setP] = useState<PlatformSettings | null>(null);
  const [a, setA] = useState<SupportAi | null>(null);
  const [s, setS] = useState<Smtp | null>(null);

  const pv = p ?? platform.data ?? null;
  const av = a ?? ai.data ?? null;
  const sv = s ?? smtp.data ?? null;

  async function save(key: string, value: unknown) {
    try {
      await saveSetting(key, value);
      toast.success("Saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3 rounded-2xl border border-border p-4">
        <h2 className="font-bold">Brand &amp; suggestions</h2>
        <div className="space-y-1.5">
          <Label htmlFor="s-brand">Brand name</Label>
          <Input id="s-brand" value={pv?.brand_name ?? ""} onChange={(e) => pv && setP({ ...pv, brand_name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-logo">Logo URL</Label>
          <Input id="s-logo" value={pv?.logo_url ?? ""} onChange={(e) => pv && setP({ ...pv, logo_url: e.target.value })} placeholder="https://…" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-pct">Same-category suggestions (%)</Label>
          <Input
            id="s-pct"
            type="number"
            min={0}
            max={100}
            value={pv?.suggestion_same_pct ?? 60}
            onChange={(e) => pv && setP({ ...pv, suggestion_same_pct: Number(e.target.value) })}
          />
          <p className="text-xs text-muted-foreground">Rest of “Similar properties” comes from other categories.</p>
        </div>
        <Button onClick={() => pv && void save("platform", pv)}>Save brand settings</Button>
      </div>

      <div className="space-y-3 rounded-2xl border border-border p-4">
        <h2 className="font-bold">AI support prompts</h2>
        <div className="space-y-1.5">
          <Label htmlFor="s-prompt">System prompt</Label>
          <Textarea
            id="s-prompt"
            rows={5}
            value={av?.prompt ?? ""}
            onChange={(e) => av && setA({ ...av, prompt: e.target.value })}
            placeholder="Reply in Hindi or English matching the user…"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s-prompts">Extra prompts (one per line)</Label>
          <Textarea
            id="s-prompts"
            rows={4}
            value={(av?.prompts ?? []).join("\n")}
            onChange={(e) => av && setA({ ...av, prompts: e.target.value.split("\n") })}
          />
        </div>
        <Button onClick={() => av && void save("support_ai", { ...av, prompts: av.prompts.filter(Boolean) })}>
          Save AI prompts
        </Button>
      </div>

      <FirebaseCard onSave={save} />

      <div className="space-y-3 rounded-2xl border border-border p-4 lg:col-span-2">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Email (SMTP)</h2>
          <Switch checked={sv?.enabled ?? false} onCheckedChange={(v) => sv && setS({ ...sv, enabled: v })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="m-host">Host</Label>
            <Input id="m-host" value={sv?.host ?? ""} onChange={(e) => sv && setS({ ...sv, host: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-port">Port</Label>
            <Input id="m-port" value={sv?.port ?? ""} onChange={(e) => sv && setS({ ...sv, port: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-user">Username</Label>
            <Input id="m-user" value={sv?.user ?? ""} onChange={(e) => sv && setS({ ...sv, user: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-from">From address</Label>
            <Input id="m-from" value={sv?.from ?? ""} onChange={(e) => sv && setS({ ...sv, from: e.target.value })} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          The SMTP password is stored as a backend secret, never in these settings.
        </p>
        <Button onClick={() => sv && void save("smtp", sv)}>Save email settings</Button>
      </div>
    </section>
  );
}
