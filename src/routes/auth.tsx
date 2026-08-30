import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppIcon } from "@/components/AppIcon";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — LocalSpot" },
      {
        name: "description",
        content:
          "Sign in to LocalSpot to explore verified places, book services, or list your own business.",
      },
      { property: "og:title", content: "Sign in — LocalSpot" },
      {
        property: "og:description",
        content:
          "Sign in to LocalSpot to explore verified places, book services, or list your own business.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type RoleChoice = "student" | "owner";
type Mode = "signin" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const { user, role, loading, refresh } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [roleChoice, setRoleChoice] = useState<RoleChoice>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Post-login navigation, plus deferred owner-role application for the
  // Google flow (where the chosen role is stashed before the redirect).
  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    const apply = async () => {
      const wanted = window.sessionStorage.getItem("localspot.role");
      window.sessionStorage.removeItem("localspot.role");
      if (wanted === "owner" && role !== "owner") {
        try {
          await supabase.from("user_roles").insert({ user_id: user.id, role: "owner" });
          await supabase
            .from("profiles")
            .update({ needs_onboarding: true })
            .eq("id", user.id);
          await refresh();
        } catch {
          /* role may already exist — ignore */
        }
      }
      const isOwner = role === "owner" || wanted === "owner";
      let ownerReady = false;
      if (isOwner) {
        const { data: biz } = await supabase
          .from("business_profiles")
          .select("onboarding_complete")
          .eq("user_id", user.id)
          .maybeSingle();
        ownerReady = Boolean(biz?.onboarding_complete);
      }
      if (!cancelled) {
        void navigate({ to: isOwner ? (ownerReady ? "/owner" : "/onboarding") : "/" });
      }
    };
    void apply();
    return () => {
      cancelled = true;
    };
  }, [user, role, loading, refresh, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        window.sessionStorage.setItem("localspot.role", roleChoice);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Account created — check your email to confirm sign-in.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      window.sessionStorage.removeItem("localspot.role");
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    window.sessionStorage.setItem("localspot.role", roleChoice);
    const res = (await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    })) as { error?: Error | null };
    if (res?.error) {
      window.sessionStorage.removeItem("localspot.role");
      toast.error(res.error.message ?? "Google sign-in failed");
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-10 px-4 py-10 lg:grid-cols-2 lg:items-center">
      <div className="hidden lg:block">
        <div className="brand-gradient rounded-3xl p-8 text-primary-foreground">
          <AppIcon name="home" className="h-14 w-14" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight">LocalSpot</h1>
          <p className="mt-3 text-sm leading-relaxed opacity-90">
            Verified places &amp; services around you — libraries, gyms, PGs, hostels, tiffin,
            laundry and more. Book in seconds, chat with owners, pay online.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            {([
              ["places", "map"],
              ["orders", "bookings"],
              ["chat", "chat"],
            ] as const).map(([label, icon]) => (
              <div key={label} className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                <AppIcon name={icon} className="mx-auto h-8 w-8" />
                <p className="mt-1.5 text-xs font-medium capitalize">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 lg:hidden">
          <AppIcon name="home" className="h-12 w-12" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Sign in to continue to LocalSpot."
            : "Join LocalSpot — it takes less than a minute."}
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-full border border-border bg-card p-1 text-sm font-medium">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-full py-2 transition-colors",
                mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        {mode === "signup" ? (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <RoleCard
              active={roleChoice === "student"}
              onClick={() => setRoleChoice("student")}
              icon="profile"
              title="I'm a student"
              desc="Explore & book places"
            />
            <RoleCard
              active={roleChoice === "owner"}
              onClick={() => setRoleChoice("owner")}
              icon="add-property"
              title="I'm a business"
              desc="List & manage my place"
            />
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === "signup" ? (
            <div className="space-y-1.5">
              <Label htmlFor="auth-name">Full name</Label>
              <Input
                id="auth-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                required
              />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="auth-password">Password</Label>
            <Input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              minLength={6}
              required
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full" size="lg">
            {busy ? <Loader2 className="animate-spin" /> : null}
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => void handleGoogle()}
          disabled={busy}
        >
          <AppIcon name="google" className="h-5 w-5" />
          Continue with Google
        </Button>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to LocalSpot's Terms &amp; Privacy Policy.
        </p>
      </div>
    </div>
  );
}

function RoleCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-4 text-left transition-colors",
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border bg-card hover:bg-accent",
      )}
    >
      <span
        className={cn(
          "grid h-9 w-9 place-items-center rounded-full",
          active ? "bg-primary/10" : "bg-muted",
        )}
      >
        <AppIcon name={icon} className="h-6 w-6" />
      </span>
      <p className="mt-2 text-sm font-semibold">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
    </button>
  );
}