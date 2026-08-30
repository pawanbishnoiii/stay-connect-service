import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { MapPin, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/format";
import { AppIcon } from "@/components/AppIcon";
import { CATEGORY_ICON } from "@/lib/icons";

type Row = {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  city: string | null;
  locality: string | null;
  price_current: number | null;
  price_unit: string | null;
  average_rating: number | null;
  categories: { slug: string; name: string } | null;
};

/**
 * "Similar Properties" — 60% from the same category the user is browsing,
 * the rest from other categories (admin can tune the mix in admin_settings).
 */
export function SimilarListings({
  listingId,
  categoryId,
  city,
  categorySlug,
}: {
  listingId: string;
  categoryId: string | null;
  city: string | null;
  categorySlug: string | null;
}) {
  const { data: mix } = useQuery({
    queryKey: ["suggestion-mix"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "suggestion_mix")
        .maybeSingle();
      const v = (data?.value ?? {}) as { same_category_percent?: number };
      return Math.min(100, Math.max(0, v.same_category_percent ?? 60));
    },
  });

  const percent = mix ?? 60;
  const total = 6;
  const sameCount = Math.round((percent / 100) * total);

  const { data } = useQuery({
    queryKey: ["similar", listingId, categoryId, city, percent],
    queryFn: async (): Promise<Row[]> => {
      const base =
        "id, slug, title, cover_url, city, locality, price_current, price_unit, average_rating, categories:category_id ( slug, name )";

      const same = categoryId
        ? await supabase
            .from("listings")
            .select(base)
            .eq("status", "published")
            .eq("category_id", categoryId)
            .neq("id", listingId)
            .order("average_rating", { ascending: false })
            .limit(sameCount)
        : { data: [] as unknown[] };

      const others = await supabase
        .from("listings")
        .select(base)
        .eq("status", "published")
        .neq("id", listingId)
        .order("is_featured", { ascending: false })
        .limit(total * 2);

      const sameRows = ((same.data ?? []) as unknown as Row[]) ?? [];
      const otherRows = ((others.data ?? []) as unknown as Row[])
        .filter((r) => !sameRows.some((s) => s.id === r.id))
        .filter((r) => (categoryId ? r.categories?.slug !== categorySlug : true))
        .slice(0, total - sameRows.length);

      return [...sameRows, ...otherRows];
    },
  });

  const rows = data ?? [];
  if (rows.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold">Similar properties</h2>
      <p className="text-sm text-muted-foreground">Take a look at these other available properties.</p>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {rows.map((r) => (
          <Link
            key={r.id}
            to="/listing/$slug"
            params={{ slug: r.slug }}
            className="overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md"
          >
            <div className="aspect-[4/3] bg-muted">
              {r.cover_url?.startsWith("http") ? (
                <img src={r.cover_url} alt={r.title} loading="lazy" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center">
                  <AppIcon name={CATEGORY_ICON[r.categories?.slug ?? ""] ?? "room"} className="h-10 w-10 opacity-70" />
                </div>
              )}
            </div>
            <div className="space-y-1 p-3">
              <p className="truncate text-sm font-semibold">{r.title}</p>
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                {r.locality || r.city || "Nearby"}
              </p>
              <p className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">
                  {inr(r.price_current)}
                  <span className="font-normal text-muted-foreground">/{r.price_unit ?? "mo"}</span>
                </span>
                <span className="flex items-center gap-0.5 text-muted-foreground">
                  <Star className="h-3 w-3 fill-warning text-warning" />
                  {(r.average_rating ?? 0).toFixed(1)}
                </span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
