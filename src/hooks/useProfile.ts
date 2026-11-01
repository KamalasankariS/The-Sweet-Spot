"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LocalProfile, ProfileExtras } from "./useLocalProfile";

const LOCAL_KEY = "sweetspot_profile";

/**
 * Profile hook that syncs with Supabase `profiles` table.
 * Falls back to localStorage for unauthenticated users.
 */
export function useProfile() {
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = useRef(createClient()).current;

  // Load profile: try Supabase first, fallback to localStorage
  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Try Supabase if configured
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && !cancelled) {
          setUserId(user.id);
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (data && !cancelled) {
            const p = rowToProfile(data);
            setProfile(p);
            // Also cache in localStorage for offline/fast loads
            localStorage.setItem(LOCAL_KEY, JSON.stringify(p));
            setLoading(false);
            return;
          }
        }
      }

      // Fallback to localStorage
      if (!cancelled) {
        const saved = localStorage.getItem(LOCAL_KEY);
        if (saved) {
          try {
            setProfile(JSON.parse(saved));
          } catch { /* ignore */ }
        }
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [supabase]);

  // Save profile to Supabase + localStorage
  const saveProfile = useCallback(async (p: LocalProfile) => {
    setProfile(p);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(p));

    if (supabase && userId) {
      const { data: { user } } = await supabase.auth.getUser();
      const meta = user?.user_metadata as Record<string, string> | undefined;
      const row = profileToRow(userId, p, meta);
      await supabase.from("profiles").upsert(row, { onConflict: "id" });
    }
  }, [supabase, userId]);

  // Partial update (for editing extras, taste history, etc.)
  const updateProfile = useCallback(async (updates: Partial<LocalProfile>) => {
    const updated = { ...profile, ...updates } as LocalProfile;
    await saveProfile(updated);
  }, [profile, saveProfile]);

  // Sync localStorage profile to Supabase (call after login)
  const syncToSupabase = useCallback(async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    // Check if profile exists in Supabase already
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (existing) {
      // Update name fields from auth metadata (these are always authoritative)
      const meta = user.user_metadata as Record<string, string> | undefined;
      if (meta) {
        const nameUpdates: Record<string, string | null> = {};
        if (meta.first_name) nameUpdates.first_name = meta.first_name;
        if (meta.last_name) nameUpdates.last_name = meta.last_name;
        if (meta.username) {
          nameUpdates.username = meta.username;
          nameUpdates.name = meta.username;
        }
        if (meta.display_name) nameUpdates.name = meta.display_name;
        if (Object.keys(nameUpdates).length > 0) {
          await supabase.from("profiles").update(nameUpdates).eq("id", user.id);
        }
      }

      // Load from Supabase (server wins for taste data)
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (data) {
        const p = rowToProfile(data);
        setProfile(p);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(p));
      }
    } else {
      // Push localStorage profile to Supabase
      const saved = localStorage.getItem(LOCAL_KEY);
      if (saved) {
        try {
          const p: LocalProfile = JSON.parse(saved);
          const meta = user.user_metadata as Record<string, string> | undefined;
          const row = profileToRow(user.id, p, meta);
          await supabase.from("profiles").upsert(row, { onConflict: "id" });
        } catch { /* ignore */ }
      }
    }
  }, [supabase]);

  return { profile, loading, saveProfile, updateProfile, syncToSupabase, userId };
}

// --- Converters ---

interface ProfileRow {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  selections: Record<string, string[]>;
  entity_ids: Record<string, Record<string, string>>;
  entity_images: Record<string, Record<string, string>>;
  extras: ProfileExtras;
  taste_history: { updatedAt: string; field: string; value: string }[];
  events_attended: number;
  created_at: string;
}

function rowToProfile(row: ProfileRow): LocalProfile {
  return {
    name: row.name,
    selections: row.selections as unknown as Record<number, string[]>,
    entityIds: row.entity_ids as unknown as Record<number, Record<string, string>>,
    entityImages: row.entity_images as unknown as Record<number, Record<string, string>>,
    extras: row.extras || {},
    tasteHistory: row.taste_history || [],
    eventsAttended: row.events_attended || 0,
    createdAt: row.created_at,
  };
}

function profileToRow(userId: string, p: LocalProfile, authMeta?: Record<string, string>) {
  return {
    id: userId,
    name: p.name || "",
    first_name: authMeta?.first_name || null,
    last_name: authMeta?.last_name || null,
    username: authMeta?.username || null,
    selections: p.selections || {},
    entity_ids: p.entityIds || {},
    entity_images: p.entityImages || {},
    extras: p.extras || {},
    taste_history: p.tasteHistory || [],
    events_attended: p.eventsAttended || 0,
    created_at: p.createdAt || new Date().toISOString(),
  };
}
