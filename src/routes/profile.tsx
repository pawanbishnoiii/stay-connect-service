import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  Heart,
  LogOut,
  MessageCircle,
  Store,
  ChevronRight,
  ShieldCheck,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserLocation } from "@/hooks/useLocation";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile & Account — LocalSpot" },
      {
        name: "description",
        content: "Manage your LocalSpot account, saved places, messages, notifications and owner tools.",
      },
      { property: "og:title", content: "Your Profile — LocalSpot" },
      { property: "og:description", content: "Manage your LocalSpot account and preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, role, loading, signOut } = useAuth();
  const { label } = useUserLocation();

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-xl font-bold">Welcome to LocalSpot</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to save places, chat with owners and manage bookings.
        </p>
        <Link
          to="/auth"
          className="mt-5 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Sign in / Create account
        </Link>
      </div>
    );
  }

  const name = profile?.full_name || user?.email?.split("@")[0] || "LocalSpot user";

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-5">
      <section className="brand-gradient flex items-center gap-4 rounded-3xl p-5 text-primary-foreground">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <span className="grid h-16 w-16 place-items-center rounded-full bg-white/20 text-xl font-bold">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{name}</p>
          <p className="truncate text-xs opacity-90">{profile?.email || user?.email}</p>
          <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold capitalize">
            <ShieldCheck className="h-3 w-3" /> {role}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card">
        <Row to="/saved" icon={Heart} label="Saved places" />
        <Row to="/chat" icon={MessageCircle} label="Messages" />
        <Row to="/chat" icon={Bell} label="Support & alerts" />
        <Row to="/owner" icon={Store} label="Owner dashboard" />
      </section>

      <section className="flex items-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm">
        <MapPin className="h-4 w-4 text-primary" />
        <span className="text-muted-foreground">Current location:</span>
        <span className="truncate font-semibold">{label}</span>
      </section>

      <button
        type="button"
        onClick={() => void signOut()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card p-3.5 text-sm font-semibold text-destructive"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
}

function Row({
  to,
  icon: Icon,
  label,
}: {
  to: "/saved" | "/chat" | "/owner";
  icon: typeof Heart;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 border-b border-border p-4 last:border-b-0"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
