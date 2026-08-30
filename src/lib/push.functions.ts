import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://connector-gateway.lovable.dev/firebase_messaging";

const sendSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(400),
  actionUrl: z.string().trim().max(300).optional(),
  audience: z.enum(["all", "self", "city"]).default("all"),
  city: z.string().trim().max(80).optional(),
  limit: z.number().int().min(1).max(500).default(200),
});

export const sendAdminPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => sendSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const lovableKey = process.env['LOVABLE_API_KEY'];
    const connKey = process.env['FIREBASE_MESSAGING_API_KEY'];
    if (!lovableKey || !connKey) throw new Error("Firebase Cloud Messaging is not connected yet.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("push_devices")
      .select("token")
      .eq("is_active", true)
      .limit(data.limit);
    if (data.audience === "self") q = q.eq("user_id", context.userId);
    if (data.audience === "city" && data.city) q = q.ilike("city", `%${data.city}%`);

    const { data: devices, error } = await q;
    if (error) throw error;
    const tokens = [...new Set((devices ?? []).map((d) => d.token))];
    if (tokens.length === 0) return { sent: 0, failed: 0, stale: 0 };

    const headers = {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connKey,
      "Content-Type": "application/json",
    };

    let sent = 0;
    let failed = 0;
    const stale: string[] = [];

    for (const token of tokens) {
      const res = await fetch(`${GATEWAY}/v1/projects/_/messages:send`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: {
            token,
            notification: { title: data.title, body: data.body },
            data: { path: data.actionUrl ?? "/" },
          },
        }),
      });
      if (res.ok) {
        sent += 1;
        continue;
      }
      const text = await res.text();
      console.error(`FCM send failed [${res.status}]: ${text}`);
      if (res.status === 404 || res.status === 400) stale.push(token);
      failed += 1;
    }

    if (stale.length) {
      await supabaseAdmin.from("push_devices").update({ is_active: false }).in("token", stale);
    }

    return { sent, failed, stale: stale.length };
  });
