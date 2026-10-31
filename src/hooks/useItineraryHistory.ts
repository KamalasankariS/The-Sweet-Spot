"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export interface StopFeedback {
  stopId: string;
  placeName: string;
  placeEntityId?: string;
  category: string;
  confirmed: boolean;
  alternativePlace?: string;
  alternativeEntityId?: string;
  rating?: number;
}

export interface ItineraryCompletion {
  id: string;
  user_id: string;
  event_id: string | null;
  event_type: string | null;
  location: string | null;
  itinerary: unknown[];
  stops_feedback: StopFeedback[];
  completed_at: string;
}

export function useItineraryHistory() {
  const [history, setHistory] = useState<ItineraryCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useRef(createClient()).current;

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!user || cancelled) { setLoading(false); return; }

      const { data } = await supabase!
        .from("itinerary_completions")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(50);

      if (data && !cancelled) setHistory(data);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [supabase]);

  // Save a completed itinerary
  const saveCompletion = useCallback(async (params: {
    eventId?: string;
    eventType: string;
    location: string;
    itinerary: unknown[];
    stopsFeedback: StopFeedback[];
  }) => {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("itinerary_completions")
      .insert({
        user_id: user.id,
        event_id: params.eventId || null,
        event_type: params.eventType,
        location: params.location,
        itinerary: params.itinerary,
        stops_feedback: params.stopsFeedback,
      })
      .select()
      .single();

    if (!error && data) {
      setHistory((prev) => [data, ...prev]);

      // Also increment events_attended on profile
      await supabase
        .from("profiles")
        .update({ events_attended: (history.length || 0) + 1 })
        .eq("id", user.id);
    }

    return data;
  }, [supabase, history.length]);

  // Get frequently visited entity IDs for Qloo signal boosting
  const getFrequentEntityIds = useCallback((): string[] => {
    const entityCounts = new Map<string, number>();

    history.forEach((completion) => {
      completion.stops_feedback.forEach((sf) => {
        if (sf.confirmed && sf.placeEntityId) {
          entityCounts.set(sf.placeEntityId, (entityCounts.get(sf.placeEntityId) || 0) + 1);
        }
        if (sf.alternativeEntityId) {
          entityCounts.set(sf.alternativeEntityId, (entityCounts.get(sf.alternativeEntityId) || 0) + 1);
        }
      });
    });

    // Sort by frequency, return top 20
    return [...entityCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([id]) => id);
  }, [history]);

  // Get frequently visited categories
  const getFrequentCategories = useCallback((): { category: string; count: number }[] => {
    const catCounts = new Map<string, number>();

    history.forEach((completion) => {
      completion.stops_feedback.forEach((sf) => {
        if (sf.confirmed) {
          catCounts.set(sf.category, (catCounts.get(sf.category) || 0) + 1);
        }
      });
    });

    return [...catCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count }));
  }, [history]);

  return {
    history,
    loading,
    saveCompletion,
    getFrequentEntityIds,
    getFrequentCategories,
  };
}
