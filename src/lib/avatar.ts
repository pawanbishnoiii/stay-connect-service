import { supabase } from "@/integrations/supabase/client";

const BUCKET = "avatars";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/**
 * Uploads a profile photo with real progress events (XHR — the JS client has no
 * progress callback) and returns a long-lived signed URL for the private bucket.
 */
export async function uploadAvatar(
  userId: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("You need to be signed in to upload a photo.");

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
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
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection."));
    xhr.send(file);
  });

  onProgress?.(100);
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, TEN_YEARS);
  if (error || !data?.signedUrl) throw error ?? new Error("Could not read the uploaded photo.");
  return data.signedUrl;
}
