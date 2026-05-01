import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "filora_sid";
function sessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export type EventType =
  | "selector_started"
  | "selector_step"
  | "selector_completed"
  | "recommendation_shown"
  | "cta_click"
  | "share_link_created"
  | "comparison_viewed"
  | "contact_submitted";

export async function track(event_type: EventType, payload: Record<string, unknown> = {}) {
  try {
    await supabase.from("analytics_events").insert({
      event_type,
      payload: payload as never,
      session_id: sessionId(),
      path: typeof window !== "undefined" ? window.location.pathname : null,
    });
    // Also dispatch a window event so external trackers (Plausible/GA) can hook in
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("filora:track", { detail: { event_type, payload } }));
    }
  } catch {
    /* swallow analytics errors */
  }
}
