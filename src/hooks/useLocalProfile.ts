"use client";

import { useState, useEffect, useCallback } from "react";

export interface EntityMedia {
  name: string;
  imageUrl?: string;
  entityId?: string;
}

export interface ProfileExtras {
  avatarEmoji?: string;
  avatarImage?: string; // data URL for uploaded image/gif
  moodEmoji?: string;
  bio?: string;
  currentSongArtist?: string;
  currentSong?: string;
  currentSongImage?: string;
  comfortMovie?: string;
  comfortMovieImage?: string;
  comfortFood?: string;
  comfortFoodImage?: string;
  shareConsent?: boolean;
}

export interface LocalProfile {
  name: string;
  selections: Record<number, string[]>;
  entityIds?: Record<number, Record<string, string>>;
  entityImages?: Record<number, Record<string, string>>; // step -> name -> imageUrl
  extras?: ProfileExtras;
  tasteHistory?: { updatedAt: string; field: string; value: string }[];
  eventsAttended?: number;
  createdAt: string;
}

export interface LocalGroup {
  id: string;
  name: string;
  mode: "social" | "corporate";
  occasion: string;
  location: string;
  members: LocalProfile[];
  createdAt: string;
}

const PROFILE_KEY = "sweetspot_profile";
const GROUP_KEY = "sweetspot_group";

export function useLocalProfile() {
  const [profile, setProfile] = useState<LocalProfile | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch {
        // ignore corrupted data
      }
    }
  }, []);

  const saveProfile = useCallback((p: LocalProfile) => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    setProfile(p);
  }, []);

  const clearProfile = useCallback(() => {
    localStorage.removeItem(PROFILE_KEY);
    setProfile(null);
  }, []);

  return { profile, saveProfile, clearProfile };
}

export function useLocalGroup() {
  const [group, setGroup] = useState<LocalGroup | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(GROUP_KEY);
    if (saved) {
      try {
        setGroup(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  const saveGroup = useCallback((g: LocalGroup) => {
    localStorage.setItem(GROUP_KEY, JSON.stringify(g));
    setGroup(g);
  }, []);

  const addMember = useCallback(
    (member: LocalProfile) => {
      if (!group) return;
      const updated = { ...group, members: [...group.members, member] };
      localStorage.setItem(GROUP_KEY, JSON.stringify(updated));
      setGroup(updated);
    },
    [group]
  );

  const clearGroup = useCallback(() => {
    localStorage.removeItem(GROUP_KEY);
    setGroup(null);
  }, []);

  return { group, saveGroup, addMember, clearGroup };
}
