import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const askSchema = z.object({ message: z.string().trim().min(1).max(2000) });

const FALLBACK_PROMPT =
  "You are LocalSpot Support, a warm and concise helper for a local services marketplace in India (PG, hostels, rooms, libraries, gyms, tiffin, laundry, home services). Reply in the same language the user writes in — Hindi, Hinglish or English. Never invent prices or availability; suggest opening the listing or messaging the owner instead.";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/**
 * In-app AI support assistant. Stores the conversation in support_messages and
 * answers with the admin-configured prompt plus the signed-in user's context.
 */
export const askSupport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => askSchema.parse(d))
  .handler(async ({ data, context }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI support is not configured yet.");

    const { supabase, userId } = context;

    const [{ data: settings }, { data: profile }, { data: history }, { data: bookings }] =
      await Promise.all([
        supabase.from("admin_settings").select("value").eq("key", "support_ai").maybeSingle(),
        supabase
          .from("profiles")
          .select("full_name,email,phone,gender")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("support_messages")
          .select("role, content")
          .eq("user_id", userId)
          .order("created_at", { ascending: true })
          .limit(30),
        supabase
          .from("listing_bookings")
          .select("status, start_date, amount, listings(title)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

    const cfg = (settings?.value ?? {}) as { prompt?: string; prompts?: string[] };
    const extra = Array.isArray(cfg.prompts) ? cfg.prompts.filter(Boolean).join("\n") : "";

    const userContext = [
      `Signed-in user: ${profile?.full_name || "unknown"} (${profile?.email || "no email"}${profile?.phone ? `, ${profile.phone}` : ""}).`,
      bookings?.length
        ? `Recent orders: ${bookings
            .map(
              (b) =>
                `${(b as { listings?: { title?: string } | null }).listings?.title ?? "listing"} — ${b.status}`,
            )
            .join("; ")}.`
        : "No orders yet.",
    ].join(" ");

    const messages: ChatMessage[] = [
      { role: "system", content: `${cfg.prompt || FALLBACK_PROMPT}\n${extra}\n${userContext}`.trim() },
      ...((history ?? []) as { role: string; content: string }[]).map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      })),
      { role: "user", content: data.message },
    ];

    await supabase.from("support_messages").insert({
      user_id: userId,
      role: "user",
      content: data.message,
    });

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: "google/gemini-3.7-flash", messages }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Support is busy right now. Please try again shortly.");
      if (res.status === 402) throw new Error("AI support credits are exhausted. Please contact the LocalSpot team.");
      throw new Error(`Support is unavailable (${res.status}). ${text.slice(0, 160)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = json.choices?.[0]?.message?.content?.trim() || "Sorry, I could not answer that.";

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("support_messages")
      .insert({ user_id: userId, role: "assistant", content: reply });

    return { reply };
  });
