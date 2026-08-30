import { supabase } from "@/integrations/supabase/client";

const BUCKET = "listing-media";
const YEAR = 60 * 60 * 24 * 365;

export type ReviewMedia = { id: string; url: string; media_type: string };

export type ListingReview = {
  id: string;
  listing_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  authorName: string;
  authorAvatar: string | null;
  media: ReviewMedia[];
};

export async function fetchListingReviews(listingId: string): Promise<ListingReview[]> {
  const { data, error } = await supabase
    .from("listing_reviews")
    .select("id, listing_id, user_id, rating, title, comment, created_at")
    .eq("listing_id", listingId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const [{ data: profiles }, { data: media }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", [...new Set(rows.map((r) => r.user_id))]),
    supabase
      .from("review_media")
      .select("id, review_id, url, media_type")
      .in("review_id", rows.map((r) => r.id)),
  ]);

  const pmap = new Map((profiles ?? []).map((p) => [p.id, p]));
  return rows.map((r) => ({
    ...r,
    authorName: pmap.get(r.user_id)?.full_name || "LocalSpot user",
    authorAvatar: pmap.get(r.user_id)?.avatar_url ?? null,
    media: ((media ?? []) as { id: string; review_id: string; url: string; media_type: string }[])
      .filter((m) => m.review_id === r.id)
      .map(({ id, url, media_type }) => ({ id, url, media_type })),
  }));
}

/** Upload one review photo/video with real progress; returns a long-lived signed URL. */
export async function uploadReviewMedia(
  userId: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ url: string; media_type: "image" | "video" }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Sign in to upload media.");

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/reviews/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const base = import.meta.env["VITE_SUPABASE_URL"] as string;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${base}/storage/v1/object/${BUCKET}/${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("x-upsert", "true");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection."));
    xhr.send(file);
  });
  onProgress?.(100);

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, YEAR);
  if (error || !data?.signedUrl) throw error ?? new Error("Could not read the uploaded file.");
  return { url: data.signedUrl, media_type: file.type.startsWith("video") ? "video" : "image" };
}

/** Creates or edits the signed-in user's review for a listing. */
export async function saveReview(params: {
  listingId: string;
  userId: string;
  rating: number;
  comment: string;
  media: { url: string; media_type: string }[];
}) {
  const { listingId, userId, rating, comment, media } = params;
  const { data, error } = await supabase
    .from("listing_reviews")
    .upsert(
      { listing_id: listingId, user_id: userId, rating, comment: comment || null },
      { onConflict: "listing_id,user_id" },
    )
    .select("id")
    .single();
  if (error) throw error;

  if (media.length) {
    const { error: mErr } = await supabase
      .from("review_media")
      .insert(media.map((m) => ({ review_id: data.id, url: m.url, media_type: m.media_type })));
    if (mErr) throw mErr;
  }
  return data.id;
}
