import { createClient } from "@/lib/supabase/client";
import type { LocalProfile } from "@/hooks/useLocalProfile";

const LOCAL_KEY = "sweetspot_profile";

/**
 * Save profile to both localStorage and Supabase (if authenticated).
 * Use this in non-hook contexts like the quiz completion page.
 */
export async function saveProfileEverywhere(profile: LocalProfile) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(profile));

  const supabase = createClient();
  if (!supabase) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("profiles").upsert({
    id: user.id,
    name: profile.name || "",
    selections: profile.selections || {},
    entity_ids: profile.entityIds || {},
    entity_images: profile.entityImages || {},
    extras: profile.extras || {},
    taste_history: profile.tasteHistory || [],
    events_attended: profile.eventsAttended || 0,
    created_at: profile.createdAt || new Date().toISOString(),
  }, { onConflict: "id" });
}
