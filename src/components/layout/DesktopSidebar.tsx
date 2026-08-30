import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Compass,
  Map as MapIcon,
  Heart,
  MessageCircle,
  Bell,
  LayoutDashboard,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/map", label: "Map", icon: MapIcon },
  { to: "/services", label: "Services", icon: LayoutDashboard },
  { to: "/saved", label: "Saved", icon: Heart },
  { to: "/chat", label: "Messages", icon: MessageCircle },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function DesktopSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-sidebar px-3 py-5 md:flex">
      <Link to="/" className="mb-6 flex items-center gap-2 px-2">
        <span className="brand-gradient flex h-9 w-9 items-center justify-center rounded-xl text-base font-black text-primary-foreground">
          L
        </span>
        <span className="text-lg font-extrabold tracking-tight">
          Local<span className="brand-text">Spot</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1">
        {LINKS.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </Link>
          );
        })}
      </nav>

      <Link
        to="/owner"
        className="brand-gradient mt-4 rounded-xl px-3 py-3 text-center text-sm font-semibold text-primary-foreground"
      >
        Owner dashboard
      </Link>
    </aside>
  );
}
