import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { BadgeCheck, CalendarDays, Loader2, MapPin, MessageCircle, Phone, Star } from "lucide-react";
import { fetchListingBySlug } from "@/lib/listings";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { inr } from "@/lib/format";
import { AppIcon } from "@/components/AppIcon";
import { CATEGORY_ICON } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startConversation } from "@/lib/chat";
import { toast } from "sonner";

export const Route = createFileRoute("/listing/$slug")({
  loader: async ({ params }) => {
    const row = await fetchListingBySlug(params.slug);
    if (!row) throw notFound();
    return row;
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData ? `${loaderData.title} — LocalSpot` : "Not found — LocalSpot",
      },
      {
        name: "description",
        content: loaderData?.description?.slice(0, 155) || "Find verified places and services near you on LocalSpot.",
      },
      {
        property: "og:title",
        content: loaderData ? `${loaderData.title} — LocalSpot` : "Not found — LocalSpot",
      },
      {
        property: "og:description",
        content: loaderData?.description?.slice(0, 155) || "Find verified places and services near you on LocalSpot.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-xl font-semibold">Listing not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        It may have been removed or is not published yet.
      </p>
      <Link
        to="/explore"
        className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Browse listings
      </Link>
    </div>
  ),
  component: ListingDetail,
});

function ListingDetail() {
  const listing = Route.useLoaderData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone] = useState("");
  const [booking, setBooking] = useState(false);
  const [chatting, setChatting] = useState(false);

  const media = [
    ...(listing.cover_url ? [{ url: listing.cover_url }] : []),
    ...(listing.listing_media ?? [])
      .filter((m) => m.url !== listing.cover_url)
      .map((m) => ({ url: m.url })),
  ];
  const needsSigning = media.some((m) => !m.url.startsWith("http"));

  const { data: signed } = useQuery({
    queryKey: ["signed-media", listing.id],
    queryFn: async () => {
      const out: Record<string, string | null> = {};
      const paths = media.map((m) => m.url).filter((u) => !u.startsWith("http"));
      await Promise.all(
        paths.map(async (p) => {
          const { data } = await supabase.storage
            .from("listing-media")
            .createSignedUrl(p, 3600);
          out[p] = data?.signedUrl ?? null;
        }),
      );
      return out;
    },
    enabled: needsSigning,
  });

  const imgSrc = (path: string) => (path.startsWith("http") ? path : signed?.[path] ?? null);

  async function placeBooking(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBooking(true);
    try {
      const price = listing.price_current ?? 0;
      const total = price * quantity;
      const { error } = await supabase.from("listing_bookings").insert({
        user_id: user.id,
        owner_id: listing.owner_id,
        listing_id: listing.id,
        amount: total,
        final_amount: total,
        quantity,
        start_date: startDate || null,
        contact_phone: phone || null,
        booking_type: "order",
        status: "new",
        payment_status: "pending",
      });
      if (error) throw error;
      toast.success("Booking request sent to the owner");
      setStartDate("");
      setQuantity(1);
      setPhone("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place booking");
    } finally {
      setBooking(false);
    }
  }

  async function startChat() {
    if (!user) {
      toast.error("Sign in to chat with the owner");
      return;
    }
    setChatting(true);
    try {
      const id = await startConversation({
        studentId: user.id,
        ownerId: listing.owner_id,
        listingId: listing.id,
      });
      void navigate({ to: "/chat", search: { c: id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start chat");
    } finally {
      setChatting(false);
    }
  }

  const catIcon = CATEGORY_ICON[listing.categories?.slug ?? ""] ?? "library";
  const plans = listing.listing_plans ?? [];
  const services = listing.listing_services ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          {/* gallery */}
          {media.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-2xl lg:grid-cols-3">
              {media.slice(0, 6).map((m, i) => (
                <div
                  key={m.url}
                  className={cnAspect(i)}
                >
                  {imgSrc(m.url) ? (
                    <img src={imgSrc(m.url)!} alt={`${listing.title} photo ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <AppIcon name={catIcon} className="h-12 w-12 opacity-70" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex aspect-[16/9] items-center justify-center rounded-2xl bg-muted">
              <AppIcon name={catIcon} className="h-20 w-20 opacity-70" />
            </div>
          )}

          <div className="mt-6 space-y-6">
            <section>
              <h2 className="text-lg font-semibold">About</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {listing.description || listing.about || "No description provided by the owner yet."}
              </p>
            </section>

            {plans.length > 0 ? (
              <section>
                <h2 className="text-lg font-semibold">Plans &amp; pricing</h2>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {plans.map((p) => (
                    <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-base font-bold">
                          {inr(p.price)}
                          <span className="text-xs font-normal text-muted-foreground"> / {p.period}</span>
                        </p>
                      </div>
                      {p.shift_name ? (
                        <p className="mt-1 text-xs text-muted-foreground">{p.shift_name}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {services.length > 0 ? (
              <section>
                <h2 className="text-lg font-semibold">Services</h2>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {services.map((s) => (
                    <div key={s.id} className="rounded-2xl border border-border bg-card p-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-base font-bold">
                          {inr(s.price)}
                          <span className="text-xs font-normal text-muted-foreground"> / {s.price_unit}</span>
                        </p>
                      </div>
                      {s.description ? (
                        <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>

        {/* sidebar */}
        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <AppIcon name={catIcon} className="h-6 w-6" />
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {listing.categories?.name ?? "Listing"}
                  </span>
                </div>
                <h1 className="mt-2 flex items-center gap-1.5 text-xl font-bold tracking-tight">
                  {listing.title}
                  {listing.verification === "verified" ? (
                    <BadgeCheck className="h-5 w-5 shrink-0 text-primary" />
                  ) : null}
                </h1>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Star className="h-4 w-4 fill-warning text-warning" />
                {(listing.average_rating ?? 0).toFixed(1)}
                <span className="font-normal text-muted-foreground">({listing.total_reviews ?? 0})</span>
              </span>
              {listing.locality || listing.city ? (
                <span className="flex min-w-0 items-center gap-1">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">{listing.locality || listing.city}</span>
                </span>
              ) : null}
            </div>

            <div className="mt-4 rounded-xl bg-muted/60 p-3">
              <p className="text-2xl font-extrabold">
                {inr(listing.price_current)}
                <span className="text-sm font-normal text-muted-foreground"> / {listing.price_unit ?? "month"}</span>
              </p>
              {listing.price_original && listing.price_current && listing.price_original > listing.price_current ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  <span className="line-through">{inr(listing.price_original)}</span>{" "}
                  <span className="font-semibold text-success">
                    {Math.round((1 - listing.price_current / listing.price_original) * 100)}% off
                  </span>
                </p>
              ) : null}
            </div>

            <form onSubmit={placeBooking} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bk-date">Date</Label>
                  <Input id="bk-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bk-qty">Quantity</Label>
                  <Input
                    id="bk-qty"
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bk-phone">Your phone</Label>
                <Input id="bk-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" />
              </div>
              {user ? (
                <Button type="submit" disabled={booking} className="w-full" size="lg">
                  {booking ? <Loader2 className="animate-spin" /> : null}
                  Book now · {inr((listing.price_current ?? 0) * quantity)}
                </Button>
              ) : (
                <Link to="/auth" className="block">
                  <Button type="button" className="w-full" size="lg">
                    Sign in to book
                  </Button>
                </Link>
              )}
            </form>

            <div className="mt-3 flex gap-2">
              {user ? (
                <Button type="button" variant="outline" className="flex-1" onClick={() => void startChat()} disabled={chatting}>
                  {chatting ? <Loader2 className="animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                  Chat
                </Button>
              ) : null}
              {listing.whatsapp ? (
                <a href={`https://wa.me/${listing.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    WhatsApp
                  </Button>
                </a>
              ) : null}
              {listing.phone ? (
                <a href={`tel:${listing.phone}`} className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    <Phone className="h-4 w-4" />
                    Call
                  </Button>
                </a>
              ) : null}
            </div>
          </div>

          {listing.address ? (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-primary" /> Address
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {listing.address}
                {listing.city ? `, ${listing.city}` : ""}
                {listing.pincode ? ` — ${listing.pincode}` : ""}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function cnAspect(i: number): string {
  // First image spans two columns on desktop
  if (i === 0) return "col-span-2 row-span-2 aspect-[4/3] lg:aspect-auto";
  return "aspect-square";
}