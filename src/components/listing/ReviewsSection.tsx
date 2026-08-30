import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { fetchListingReviews, saveReview, uploadReviewMedia } from "@/lib/reviews";
import { cn } from "@/lib/utils";

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          aria-label={`${n} star`}
          className={cn(onChange && "transition-transform hover:scale-110")}
        >
          <Star
            className={cn(
              "h-5 w-5",
              n <= value ? "fill-warning text-warning" : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewsSection({ listingId }: { listingId: string }) {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const { data, isPending } = useQuery({
    queryKey: ["listing-reviews", listingId],
    queryFn: () => fetchListingReviews(listingId),
  });

  const reviews = data ?? [];
  const mine = user ? reviews.find((r) => r.user_id === user.id) : undefined;
  const profileComplete = Boolean(profile?.full_name && profile?.phone && profile?.gender);

  function startEdit() {
    setEditing(true);
    setRating(mine?.rating ?? 0);
    setComment(mine?.comment ?? "");
  }

  async function submit() {
    if (!user) return;
    if (rating < 1) {
      toast.error("Pick a star rating first");
      return;
    }
    setSaving(true);
    try {
      const uploaded: { url: string; media_type: string }[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i]!;
        const done = (i / files.length) * 100;
        const item = await uploadReviewMedia(user.id, f, (p) =>
          setProgress(Math.round(done + p / files.length)),
        );
        uploaded.push(item);
      }
      setProgress(null);
      await saveReview({ listingId, userId: user.id, rating, comment, media: uploaded });
      toast.success(mine ? "Review updated" : "Thanks for your review!");
      setFiles([]);
      setEditing(false);
      await qc.invalidateQueries({ queryKey: ["listing-reviews", listingId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your review");
    } finally {
      setProgress(null);
      setSaving(false);
    }
  }

  return (
    <section id="reviews">
      <h2 className="text-lg font-semibold">Ratings &amp; reviews</h2>

      {user ? (
        profileComplete ? (
          mine && !editing ? (
            <div className="mt-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <Stars value={mine.rating} />
                <Button variant="outline" size="sm" onClick={startEdit}>
                  Edit my review
                </Button>
              </div>
              {mine.comment ? <p className="mt-2 text-sm text-muted-foreground">{mine.comment}</p> : null}
            </div>
          ) : (
            <div className="mt-3 space-y-3 rounded-2xl border border-border bg-card p-4">
              <Stars value={rating} onChange={setRating} />
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience — cleanliness, food, staff, value…"
                rows={3}
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                multiple
                hidden
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <ImagePlus className="h-4 w-4" /> Add photos / videos
                </Button>
                {files.length ? (
                  <span className="text-xs text-muted-foreground">{files.length} file(s) selected</span>
                ) : null}
              </div>
              {progress != null ? <Progress value={progress} className="h-2" /> : null}
              <div className="flex gap-2">
                <Button onClick={() => void submit()} disabled={saving}>
                  {saving ? <Loader2 className="animate-spin" /> : null}
                  {mine ? "Update review" : "Post review"}
                </Button>
                {editing ? (
                  <Button variant="ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>
          )
        ) : (
          <p className="mt-3 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            Complete your profile (name, mobile and gender) to rate this place.
          </p>
        )
      ) : (
        <p className="mt-3 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Sign in to leave a rating.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {isPending ? (
          <div className="h-20 animate-pulse rounded-2xl bg-muted" />
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet — be the first.</p>
        ) : (
          reviews.map((r) => (
            <article key={r.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                {r.authorAvatar ? (
                  <img src={r.authorAvatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {r.authorName.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{r.authorName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="ml-auto">
                  <Stars value={r.rating} />
                </span>
              </div>
              {r.comment ? <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p> : null}
              {r.media.length ? (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {r.media.map((m) =>
                    m.media_type === "video" ? (
                      <video key={m.id} src={m.url} controls className="h-24 w-32 rounded-xl object-cover" />
                    ) : (
                      <img
                        key={m.id}
                        src={m.url}
                        alt=""
                        loading="lazy"
                        className="h-24 w-24 rounded-xl object-cover"
                      />
                    ),
                  )}
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
