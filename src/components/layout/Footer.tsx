import { Link } from "@tanstack/react-router";
import { AppIcon } from "@/components/AppIcon";
import { CATEGORY_META } from "@/lib/categories";

const CITIES = [
  "Jaipur", "Kota", "Jodhpur", "Udaipur", "Ajmer", "Bikaner", "Sikar", "Alwar", "Delhi", "Indore",
];

export function Footer() {
  return (
    <footer className="mt-10 border-t border-border bg-card/60">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <AppIcon name="home" className="h-9 w-9" />
              <span className="text-lg font-extrabold">LocalSpot</span>
            </div>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Verified stays, study spaces and daily services around you — book, chat and manage in one app.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold">Our cozy homes in</h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              {CITIES.map((c) => (
                <li key={c}>
                  <Link to="/search" search={{ q: c }} className="hover:text-foreground">
                    Stays in {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold">Explore</h3>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {CATEGORY_META.slice(0, 8).map((c) => (
                <li key={c.slug}>
                  <Link to="/search" search={{ category: c.slug }} className="hover:text-foreground">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold">Company</h3>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <li><Link to="/owner" className="hover:text-foreground">List your property</Link></li>
              <li><Link to="/chat" search={{ c: "support" }} className="hover:text-foreground">Help &amp; support</Link></li>
              <li><Link to="/explore" className="hover:text-foreground">Explore nearby</Link></li>
              <li><Link to="/profile" className="hover:text-foreground">My account</Link></li>
            </ul>
          </div>
        </div>

        <p className="mt-8 border-t border-border pt-5 text-xs text-muted-foreground">
          © {new Date().getFullYear()} LocalSpot. Made for students, owners and local service providers.
        </p>
      </div>
    </footer>
  );
}
