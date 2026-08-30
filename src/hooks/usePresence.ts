import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const TICK_MS = 60_000;

/**
 * Records last-seen time and accumulated time-spent for the signed-in user so
 * admins can see activity. Only counts time while the tab is visible.
 */
export function usePresence() {
  const { user } = useAuth();
  const seconds = useRef(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function beat() {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      seconds.current += TICK_MS / 1000;
      const { data } = await supabase
        .from("profiles")
        .select("total_seconds")
        .eq("id", user!.id)
        .maybeSingle();
      if (cancelled) return;
      await supabase
        .from("profiles")
        .update({
          last_seen_at: new Date().toISOString(),
          total_seconds: (data?.total_seconds ?? 0) + TICK_MS / 1000,
        })
        .eq("id", user!.id);
    }

    void supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", user.id);
    const id = window.setInterval(() => void beat(), TICK_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [user]);
}
