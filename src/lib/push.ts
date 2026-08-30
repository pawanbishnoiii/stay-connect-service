import { supabase } from "@/integrations/supabase/client";

const appId = import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID'] as
  | string
  | undefined;
const vapidKey = import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY'] as
  | string
  | undefined;

export const firebaseConfig = {
  apiKey: import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY'] as
    | string
    | undefined,
  projectId: import.meta.env['VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID'] as
    | string
    | undefined,
  appId,
  messagingSenderId: appId?.split(":")[1] ?? "",
};

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
