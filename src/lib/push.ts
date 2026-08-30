import { supabase } from "@/integrations/supabase/client";

const envAppId = import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID'] as
  | string
  | undefined;
const envVapid = import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY'] as
  | string
  | undefined;

export type FirebaseWebConfig = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
  vapidKey?: string;
};

/** Env/connector defaults — admins can override these from the Admin panel. */
export const firebaseConfig: FirebaseWebConfig = {
  apiKey: import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY'] as
    | string
    | undefined,
  projectId: import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID'] as
    | string
    | undefined,
  appId: envAppId,
  messagingSenderId: envAppId?.split(":")[1] ?? "",
  vapidKey: envVapid,
};

export const FIREBASE_SETTING_KEY = "firebase_web_config";

let cached: FirebaseWebConfig | null = null;

function clean(cfg: FirebaseWebConfig): FirebaseWebConfig {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(cfg)) if (typeof v === "string" && v.trim()) out[k] = v.trim();
  return out as FirebaseWebConfig;
}

/** Admin-managed config from the database, falling back to connector env values. */
export async function resolveFirebaseConfig(force = false): Promise<FirebaseWebConfig> {
  if (cached && !force) return cached;
  let override: FirebaseWebConfig = {};
  try {
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", FIREBASE_SETTING_KEY)
      .maybeSingle();
    if (data?.value && typeof data.value === "object") override = data.value as FirebaseWebConfig;
  } catch {
    /* offline or blocked — fall back to env */
  }
  const merged = clean({ ...firebaseConfig, ...override });
  if (!merged.messagingSenderId && merged.appId) merged.messagingSenderId = merged.appId.split(":")[1];
  cached = merged;
  return merged;
}

export function isConfigComplete(cfg: FirebaseWebConfig): boolean {
  return Boolean(cfg.apiKey && cfg.projectId && cfg.appId && cfg.messagingSenderId && cfg.vapidKey);
}

export type PushResult =
  | { status: "registered"; token: string }
  | { status: "not-configured" | "unsupported" | "open-in-new-tab" | "denied" };

export function pushConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.appId &&
      firebaseConfig.messagingSenderId &&
      vapidKey,
  );
}

/** Must be called from a user gesture. Registers the browser for FCM push. */
export async function enablePush(opts?: {
  userId?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
}): Promise<PushResult> {
  if (!pushConfigured()) return { status: "not-configured" };

  const { isSupported, getMessaging, getToken } = await import("firebase/messaging");
  if (!("Notification" in window) || !(await isSupported())) return { status: "unsupported" };
  if (window.top !== window.self) return { status: "open-in-new-tab" };

  const permission =
    Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return { status: "denied" };

  const { initializeApp, getApps, getApp } = await import("firebase/app");
  const query = new URLSearchParams(firebaseConfig as Record<string, string>).toString();
  const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`);
  const app = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig as Record<string, string>);
  const token = await getToken(getMessaging(app), {
    vapidKey: vapidKey!,
    serviceWorkerRegistration: registration,
  });
  if (!token) return { status: "denied" };

  await supabase.from("push_devices").upsert(
    {
      token,
      user_id: opts?.userId ?? null,
      platform: "web",
      user_agent: navigator.userAgent.slice(0, 300),
      city: opts?.city ?? null,
      lat: opts?.lat ?? null,
      lng: opts?.lng ?? null,
      is_active: true,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "token" },
  );

  return { status: "registered", token };
}

export function pushStatusMessage(status: PushResult["status"]): string {
  switch (status) {
    case "registered":
      return "Push notifications are on for this device.";
    case "open-in-new-tab":
      return "Open the app in its own browser tab to allow notifications.";
    case "denied":
      return "Notifications are blocked. Enable them in your browser site settings.";
    case "unsupported":
      return "This browser does not support web push notifications.";
    default:
      return "Push notifications are not configured yet.";
  }
}

/** Listen for messages while the app is in the foreground. */
export async function onForegroundPush(cb: (payload: unknown) => void): Promise<() => void> {
  if (!pushConfigured()) return () => {};
  const { isSupported, getMessaging, onMessage } = await import("firebase/messaging");
  if (!(await isSupported())) return () => {};
  const { initializeApp, getApps, getApp } = await import("firebase/app");
  const app = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig as Record<string, string>);
  return onMessage(getMessaging(app), cb);
}
