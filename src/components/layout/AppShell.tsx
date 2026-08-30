import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Search, MapPin, ChevronDown, Shield } from "lucide-react";
import { DesktopSidebar } from "./DesktopSidebar";
import { BottomNav } from "./BottomNav";
import { Footer } from "./Footer";
import { useUserLocation } from "@/hooks/useLocation";
import { useAuth } from "@/hooks/useAuth";
import { usePresence } from "@/hooks/usePresence";
import { initials } from "@/lib/format";
import { LocationPicker } from "@/components/LocationPicker";

export function AppShell({ children }: { children: ReactNode }) {
  const { label } = useUserLocation();
  const { user, profile, role } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  usePresence();


  return (
    <div className="flex min-h-screen bg-background">
      <DesktopSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex min-w-0 shrink items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium"
            >
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <span className="max-w-[9rem] truncate sm:max-w-[14rem]">{label}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>

            <form
              className="relative hidden min-w-0 flex-1 md:block"
              onSubmit={(e) => {
                e.preventDefault();
                void navigate({ to: "/search", search: { q } });
              }}
            >
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search libraries, gyms, PG, tiffin, services..."
                className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
            </form>

            <div className="ml-auto flex items-center gap-2">
              {role === "admin" ? (
                <Link
                  to="/admin"
                  aria-label="Admin console"
                  className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card"
                >
                  <Shield className="h-[18px] w-[18px] text-primary" />
                </Link>
              ) : null}
              <Link
                to="/owner"
                className="hidden rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary lg:block"
              >
                List Your Property
              </Link>
              <Link

                to="/chat"
                search={{ c: "support" }}
                aria-label="Messages and support"
                className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card"
              >
                <Bell className="h-[18px] w-[18px]" />
              </Link>
              <Link
                to={user ? "/profile" : "/auth"}
                className="brand-gradient grid h-10 w-10 place-items-center overflow-hidden rounded-full text-xs font-bold text-primary-foreground"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials(profile?.full_name ?? user?.email, "LS")
                )}
              </Link>
            </div>
          </div>

          <form
            className="relative px-4 pb-3 md:hidden"
            onSubmit={(e) => {
              e.preventDefault();
              void navigate({ to: "/search", search: { q } });
            }}
          >
            <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search places & services..."
              className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </form>
        </header>

        <main className="min-w-0 flex-1 pb-24 md:pb-8">{children}</main>
        <Footer />

      </div>

      <BottomNav />
      <LocationPicker open={pickerOpen} onOpenChange={setPickerOpen} />
    </div>
  );
}
