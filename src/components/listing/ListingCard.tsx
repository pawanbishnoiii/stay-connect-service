import { Link } from "@tanstack/react-router";
import { Star, MapPin, Heart, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { inr, km } from "@/lib/format";
import { AppIcon } from "@/components/AppIcon";
import { CATEGORY_ICON } from "@/lib/icons";
import type { ListingWithDistance } from "@/lib/listings";

export function ListingCard({
  listing,
  className,
  onToggleSave,
  saved,
}: {
  listing: ListingWithDistance;
  className?: string;
  onToggleSave?: (id: string) => void;
  saved?: boolean;
}) {
  const cat = listing.category_slug ?? "library";
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg",
        className,
      )}
    >
      <Link to="/listing/$slug" params={{ slug: listing.slug }} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {listing.cover_url ? (
            <img
              src={listing.cover_url}
              alt={listing.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <AppIcon name={CATEGORY_ICON[cat] ?? "library"} className="h-14 w-14 opacity-80" />
            </div>
          )}
          {listing.is_featured ? (
            <span className="brand-gradient absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
              Popular
            </span>
          ) : null}
        </div>
      </Link>

      {onToggleSave ? (
        <button
          type="button"
          onClick={() => onToggleSave(listing.id)}
          aria-label={saved ? "Remove from saved" : "Save listing"}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-card/90 shadow-sm backdrop-blur transition-colors hover:bg-card"
        >
          <Heart className={cn("h-4 w-4", saved ? "fill-destructive text-destructive" : "text-muted-foreground")} />
        </button>
      ) : null}

      <div className="space-y-2 p-3.5">
        <Link to="/listing/$slug" params={{ slug: listing.slug }} className="block">
          <h3 className="flex min-w-0 items-center gap-1.5 truncate text-[15px] font-semibold tracking-tight">
            <span className="truncate">{listing.title}</span>
            {listing.verification === "verified" ? (
              <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
            ) : null}
          </h3>
        </Link>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-medium text-foreground">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" />
            {(listing.average_rating ?? 0).toFixed(1)}
            <span className="font-normal text-muted-foreground">({listing.total_reviews ?? 0})</span>
          </span>
          {listing.distance_km != null ? <span>• {km(listing.distance_km)}</span> : null}
          {listing.locality ? (
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{listing.locality}</span>
            </span>
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-2 pt-1">
          <p className="text-base font-bold">
            {inr(listing.price_current)}
            <span className="text-xs font-normal text-muted-foreground"> / {listing.price_unit ?? "month"}</span>
          </p>
          {listing.price_original && listing.price_current && listing.price_original > listing.price_current ? (
            <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
              {Math.round((1 - listing.price_current / listing.price_original) * 100)}% OFF
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ListingCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      <div className="aspect-[4/3] w-full animate-pulse bg-muted" />
      <div className="space-y-2.5 p-3.5">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-5 w-2/5 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
