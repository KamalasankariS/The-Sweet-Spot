"use client";

import { IconMusic, IconRestaurant, IconTheater , Icon } from "@/components/icons/SweetSpotIcons";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Navbar } from "@/components/layout/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Toast } from "@/components/ui/Toast";
import { moderateName, moderateBio, moderateImageFile, resizeImage } from "@/lib/moderation";
import type { LocalProfile, ProfileExtras } from "@/hooks/useLocalProfile";
import { useProfile } from "@/hooks/useProfile";
import { getCuisineFlag, FOOD_SUGGESTIONS } from "@/lib/cuisineFlags";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { ShareProfileModal } from "@/components/ui/ShareProfileModal";
import { UsernameInput } from "@/components/ui/UsernameInput";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { ALL_COUNTRIES } from "@/lib/countries";

const AVATAR_OPTIONS = [
  "music", "mic", "music", "theater", "restaurant", "taco", "restaurant", "palette",
  "tree", "fire", "tree", "magic", "heart", "heart", "crystal", "sun",
  "sparkle", "target", "coffee", "disco", "sparkle", "cocktail", "tree", "crystal",
];

const MOOD_OPTIONS = [
  { emoji: "heart", label: "Chill" },
  { emoji: "fire", label: "Hyped" },
  { emoji: "heart", label: "Romantic" },
  { emoji: "fire", label: "Chaotic" },
  { emoji: "star", label: "Cool" },
  { emoji: "coffee", label: "Low-key" },
  { emoji: "sparkle", label: "Magical" },
  { emoji: "fire", label: "Melting" },
  { emoji: "crystal", label: "Dead" },
  { emoji: "sparkle", label: "Nerdy" },
  { emoji: "crystal", label: "Ghosting" },
  { emoji: "magic", label: "Foxy" },
];

const CATEGORY_LABELS = ["Music", "Movies & TV", "Dining", "Nightlife & Vibes", "Brands & Style"];
const CATEGORY_ICONS = ["music", "theater", "restaurant", "crystal", "sparkle"];

interface QlooSongResult {
  name: string;
  entity_id: string;
  properties?: {
    image?: { url?: string };
    short_description?: string;
  };
}

interface MusicResult {
  type: "artist" | "album";
  artistName: string;
  trackName: string;
  artworkUrl: string;
  entityId: string;
  description: string;
}

// --- Music search hook using iTunes API (artist + song + artwork in one) ---
function useMusicSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MusicResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ q: query, take: "6" });
        const res = await fetch(`/api/music/search?${params}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const clear = useCallback(() => { setQuery(""); setResults([]); }, []);
  return { query, setQuery, results, searching, clear };
}

interface FoodResult {
  name: string;
  id: string;
  imageUrl?: string;
}

// Fetch Wikipedia thumbnail for a food name
async function getWikiFoodImage(name: string): Promise<string | undefined> {
  try {
    const params = new URLSearchParams({
      action: "query",
      titles: name,
      prop: "pageimages",
      format: "json",
      pithumbsize: "200",
      origin: "*",
      redirects: "1",
    });
    const res = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
    const data = await res.json();
    const pages = data.query?.pages || {};
    for (const page of Object.values(pages) as Array<{ thumbnail?: { source?: string } }>) {
      if (page.thumbnail?.source) return page.thumbnail.source;
    }
  } catch {
    // ignore
  }
  return undefined;
}

// --- Food tag autocomplete hook using Qloo tags + Wikipedia images ---
function useFoodAutocomplete() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ q: query, take: "6" });
        const res = await fetch(`/api/qloo/food-tags?${params}`);
        const data = await res.json();
        const tags: Array<{ name: string; id: string }> = data.results || [];

        // Enrich with Wikipedia images in parallel
        const enriched = await Promise.all(
          tags.map(async (t) => ({
            name: t.name,
            id: t.id,
            imageUrl: await getWikiFoodImage(t.name),
          }))
        );
        setResults(enriched);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const clear = useCallback(() => { setQuery(""); setResults([]); }, []);
  return { query, setQuery, results, searching, clear };
}

function getPersonalizationLevel(profile: LocalProfile): { level: number; label: string; color: string } {
  let score = 0;
  const totalPicks = Object.values(profile.selections).flat().length;
  score += Math.min(totalPicks * 2, 20);
  if (profile.extras?.avatarEmoji || profile.extras?.avatarImage) score += 5;
  if (profile.extras?.moodEmoji) score += 5;
  if (profile.extras?.bio) score += 10;
  if (profile.extras?.currentSong) score += 10;
  if (profile.extras?.comfortMovie) score += 10;
  if (profile.extras?.comfortFood) score += 10;
  score += Math.min((profile.tasteHistory?.length || 0) * 3, 15);
  score += Math.min((profile.eventsAttended || 0) * 5, 15);
  const pct = Math.min(score, 100);
  if (pct < 25) return { level: pct, label: "Getting Started", color: "#E8B88A" };
  if (pct < 50) return { level: pct, label: "Taking Shape", color: "#E8788A" };
  if (pct < 75) return { level: pct, label: "Well Defined", color: "#B8A0D2" };
  return { level: pct, label: "Fully Realized", color: "#8CBFD4" };
}

// --- Qloo autocomplete hook for song/movie/food fields ---
function useQlooAutocomplete(entityType: string) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QlooSongResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ q: query, take: "5", types: entityType });
        const res = await fetch(`/api/qloo/search?${params}`);
        const data = await res.json();
        const q = query.toLowerCase().trim();
        const sorted = (data.results || []).sort((a: QlooSongResult, b: QlooSongResult) => {
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          const aExact = aName === q ? 0 : 1;
          const bExact = bName === q ? 0 : 1;
          if (aExact !== bExact) return aExact - bExact;
          const collab = /[&,]| x | feat/i;
          const aCollab = collab.test(a.name) ? 1 : 0;
          const bCollab = collab.test(b.name) ? 1 : 0;
          if (aCollab !== bCollab) return aCollab - bCollab;
          return aName.length - bName.length;
        });
        setResults(sorted);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, entityType]);

  const clear = useCallback(() => { setQuery(""); setResults([]); }, []);
  return { query, setQuery, results, searching, clear };
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile: supaProfile, saveProfile: saveToSupabase } = useProfile();
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState("");

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Share consent state
  const [shareRequests, setShareRequests] = useState<{ from: string; timestamp: string }[]>([]);

  // Edit state
  const [avatarEmoji, setAvatarEmoji] = useState("music");
  const [avatarImage, setAvatarImage] = useState<string | undefined>(undefined);
  const [moodEmoji, setMoodEmoji] = useState("");
  const [bio, setBio] = useState("");
  const [currentSongArtist, setCurrentSongArtist] = useState("");
  const [currentSong, setCurrentSong] = useState("");
  const [currentSongImage, setCurrentSongImage] = useState<string | undefined>(undefined);
  const [comfortMovie, setComfortMovie] = useState("");
  const [comfortMovieImage, setComfortMovieImage] = useState<string | undefined>(undefined);
  const [comfortFood, setComfortFood] = useState("");
  const [comfortFoodImage, setComfortFoodImage] = useState<string | undefined>(undefined);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileShareable, setProfileShareable] = useState(false);
  const [orientation, setOrientation] = useState<ProfileExtras["orientation"]>(undefined);
  const [orientationVisible, setOrientationVisible] = useState(false);
  const [regionCountry, setRegionCountry] = useState("");
  const [regionState, setRegionState] = useState("");
  const [regionCity, setRegionCity] = useState("");
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Music search (iTunes: artist + song + artwork), movie (Qloo)
  const musicSearch = useMusicSearch();
  const movieSearch = useQlooAutocomplete("urn:entity:movie,urn:entity:tv_show");
  const foodSearch = useFoodAutocomplete();

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }, []);

  // Screenshot deterrent — blocks print screen, right-click, dev tools shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        showToast("Screenshots are disabled on profile pages");
      }
      // Cmd+Shift+3/4 (macOS screenshots) - can't fully block but deter
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "5")) {
        showToast("Screenshots are disabled on profile pages");
      }
      // Ctrl+P (print)
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        showToast("Printing is disabled on profile pages");
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showToast("Right-click is disabled on profile pages");
    };

    const handleVisibilityChange = () => {
      // When user switches away (potentially to screenshot), we could blur content
      // but that's aggressive — just log it
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [showToast]);

  // Hydrate local state from useProfile hook (Supabase -> localStorage fallback)
  useEffect(() => {
    const p = supaProfile;
    if (!p) return;
    setProfile(p);
    setProfileShareable(p.extras?.shareConsent ?? false);
    if (p.extras) {
      setAvatarEmoji(p.extras.avatarEmoji || "music");
      setAvatarImage(p.extras.avatarImage);
      setMoodEmoji(p.extras.moodEmoji || "");
      setBio(p.extras.bio || "");
      setCurrentSongArtist(p.extras.currentSongArtist || "");
      setCurrentSong(p.extras.currentSong || "");
      setCurrentSongImage(p.extras.currentSongImage);
      setComfortMovie(p.extras.comfortMovie || "");
      setComfortMovieImage(p.extras.comfortMovieImage);
      setComfortFood(p.extras.comfortFood || "");
      setComfortFoodImage(p.extras.comfortFoodImage);
      setOrientation(p.extras.orientation);
      setOrientationVisible(p.extras.orientationVisible ?? false);
      setRegionCountry(p.extras.regionCountry || "");
      setRegionState(p.extras.regionState || "");
      setRegionCity(p.extras.regionCity || "");
      setDietaryPreferences(p.extras.dietaryPreferences || []);
    }

    // Load pending share requests
    const reqs = localStorage.getItem("sweetspot_share_requests");
    if (reqs) {
      try { setShareRequests(JSON.parse(reqs)); } catch { /* ignore */ }
    }
  }, [supaProfile]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileCheck = moderateImageFile(file);
    if (!fileCheck.passed) {
      showToast(fileCheck.reason!);
      e.target.value = "";
      return;
    }
    setUploadingImage(true);
    try {
      const dataUrl = await resizeImage(file, 256, 256, 0.85);
      setAvatarImage(dataUrl);
      setAvatarEmoji("");
      setShowAvatarPicker(false);
    } catch {
      showToast("Failed to process image. Try a different file.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const toggleShareConsent = () => {
    if (!profile) return;
    const newVal = !profileShareable;
    setProfileShareable(newVal);
    const updated = {
      ...profile,
      extras: { ...profile.extras, shareConsent: newVal },
    };
    saveToSupabase(updated as LocalProfile);
    setProfile(updated as LocalProfile);
    showToast(newVal ? "Profile sharing enabled" : "Profile sharing disabled — others can't share your profile");
  };

  const handleShareRequest = (from: string, approved: boolean) => {
    const updated = shareRequests.filter((r) => r.from !== from);
    setShareRequests(updated);
    localStorage.setItem("sweetspot_share_requests", JSON.stringify(updated));
    showToast(approved ? `Approved ${from}'s request to share your profile` : `Declined ${from}'s request`);
  };

  const handleSave = () => {
    if (!profile) return;
    const nameCheck = moderateName(profile.name);
    if (!nameCheck.passed) { showToast(nameCheck.reason!); return; }
    if (bio.trim()) {
      const bioCheck = moderateBio(bio.trim());
      if (!bioCheck.passed) { showToast(bioCheck.reason!); return; }
    }

    const newExtras: ProfileExtras = {
      avatarEmoji: avatarImage ? undefined : (avatarEmoji || undefined),
      avatarImage: avatarImage || undefined,
      moodEmoji: moodEmoji || undefined,
      bio: bio.trim() || undefined,
      currentSongArtist: currentSongArtist.trim() || undefined,
      currentSong: currentSong.trim() || undefined,
      currentSongImage: currentSongImage || undefined,
      comfortMovie: comfortMovie.trim() || undefined,
      comfortMovieImage: comfortMovieImage || undefined,
      comfortFood: comfortFood.trim() || undefined,
      comfortFoodImage: comfortFoodImage || undefined,
      shareConsent: profileShareable,
      orientation: orientation || undefined,
      orientationVisible,
      regionCountry: regionCountry || undefined,
      regionState: regionState || undefined,
      regionCity: regionCity || undefined,
      dietaryPreferences: dietaryPreferences.length > 0 ? dietaryPreferences : undefined,
    };

    const history = [...(profile.tasteHistory || [])];
    const oldExtras = profile.extras || {};
    const now = new Date().toISOString();
    if (currentSong.trim() && currentSong.trim() !== oldExtras.currentSong)
      history.push({ updatedAt: now, field: "currentSong", value: currentSong.trim() });
    if (comfortMovie.trim() && comfortMovie.trim() !== oldExtras.comfortMovie)
      history.push({ updatedAt: now, field: "comfortMovie", value: comfortMovie.trim() });
    if (comfortFood.trim() && comfortFood.trim() !== oldExtras.comfortFood)
      history.push({ updatedAt: now, field: "comfortFood", value: comfortFood.trim() });

    const updated: LocalProfile = { ...profile, extras: newExtras, tasteHistory: history };
    // Save to Supabase + localStorage via hook
    saveToSupabase(updated);
    setProfile(updated);

    // Save name/username to Supabase auth metadata if changed
    if (supabase && (editFirstName.trim() || editLastName.trim() || editUsername.trim())) {
      const data: Record<string, string> = {};
      if (editFirstName.trim()) data.first_name = editFirstName.trim();
      if (editLastName.trim()) data.last_name = editLastName.trim();
      if (editUsername.trim()) data.username = editUsername.trim();
      if (editFirstName.trim() && editLastName.trim()) {
        data.display_name = `${editFirstName.trim()} ${editLastName.trim()}`;
      }
      supabase.auth.updateUser({ data }).catch(() => {});
    }

    setEditing(false);
    musicSearch.clear();
    movieSearch.clear();
    foodSearch.clear();
    showToast("Profile updated!");
  };

  if (!user) {
    return (
      <>
        <AnimatedBackground />
        <Navbar />
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "6rem 2rem 2rem" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(184,160,210,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2.5" ry="2.5" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
                <circle cx="12" cy="16.5" r="1.5" fill="rgba(232,120,138,0.6)" stroke="none" />
                <line x1="12" y1="18" x2="12" y2="19.5" stroke="rgba(232,120,138,0.6)" strokeWidth="1.5" />
              </svg>
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem" }}>Sign In Required</h2>
            <p style={{ color: "rgba(107,100,90,0.8)", marginBottom: "1.5rem" }}>Sign in to view and manage your profile.</p>
            <a href="/auth"><GradientButton>Sign In</GradientButton></a>
          </div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <AnimatedBackground />
        <Navbar />
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "6rem 2rem 2rem" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(140,191,212,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M20 21a8 8 0 00-16 0" />
              </svg>
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem" }}>No Profile Yet</h2>
            <p style={{ color: "rgba(107,100,90,0.8)", marginBottom: "1.5rem" }}>Take the quiz to create your taste profile.</p>
            <a href="/quiz"><GradientButton>Take the Quiz</GradientButton></a>
          </div>
        </div>
      </>
    );
  }

  const personalization = getPersonalizationLevel(profile);
  const extras = profile.extras || {};
  const totalPicks = Object.values(profile.selections).flat().length;
  const hasCustomImage = !!extras.avatarImage;

  return (
    <>
      <AnimatedBackground />
      <Navbar />

      {/* Profile content — screenshot deterrent styles */}
      <div
        style={{ minHeight: "100vh", padding: "7rem 1.5rem 4rem", userSelect: "none", WebkitUserSelect: "none" }}
        onDragStart={(e) => e.preventDefault()}
      >
        <div style={{ maxWidth: "36rem", margin: "0 auto" }}>
          {/* Profile header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", marginBottom: "2rem" }}
          >
            {/* Avatar — clickable for zoom */}
            {hasCustomImage ? (
              <button
                onClick={() => setLightboxOpen(true)}
                style={{
                  width: "5rem", height: "5rem", borderRadius: "50%",
                  border: "2px solid rgba(232,224,214,0.7)",
                  overflow: "hidden", margin: "0 auto 1rem",
                  cursor: "pointer", padding: 0, background: "transparent",
                  transition: "transform 0.2s, border-color 0.2s",
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.borderColor = "rgba(232,224,214,0.9)"; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = "rgba(232,224,214,0.7)"; }}
              >
                <img
                  src={extras.avatarImage}
                  alt="Profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
                  draggable={false}
                />
              </button>
            ) : (
              <div style={{
                width: "5rem", height: "5rem", borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(232,120,138,0.2), rgba(184,160,210,0.2))",
                border: "2px solid rgba(232,224,214,0.6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "2.5rem", margin: "0 auto 1rem",
              }}>
                {extras.avatarEmoji ? <Icon name={extras.avatarEmoji} size={36} /> : (user?.user_metadata?.username || profile.name || "?")[0].toUpperCase()}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
                {user?.user_metadata?.username || profile.name}
              </h1>
              {!editing && (
                <button
                  onClick={() => {
                    setEditFirstName(user?.user_metadata?.first_name || "");
                    setEditLastName(user?.user_metadata?.last_name || "");
                    setEditUsername(user?.user_metadata?.username || "");
                    setEditing(true);
                  }}
                  title="Edit profile"
                  style={{
                    background: "none", border: "none", cursor: "pointer", padding: "0.25rem",
                    color: "rgba(107,100,90,0.4)", transition: "color 0.2s", display: "flex", alignItems: "center",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(107,100,90,0.8)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(107,100,90,0.4)")}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </button>
              )}
            </div>
            {user?.user_metadata?.first_name && user?.user_metadata?.last_name && (
              <p style={{ fontSize: "0.85rem", color: "rgba(107,100,90,0.5)", marginBottom: "0.25rem" }}>
                {user.user_metadata.first_name} {user.user_metadata.last_name}
              </p>
            )}
            {extras.moodEmoji && (
              <span style={{ fontSize: "0.85rem", color: "rgba(107,100,90,0.8)" }}>
                {MOOD_OPTIONS.find((m) => m.emoji === extras.moodEmoji)?.label || ""} {extras.moodEmoji}
              </span>
            )}
            {extras.bio && (
              <p style={{ color: "rgba(107,100,90,0.7)", fontSize: "0.875rem", marginTop: "0.5rem", maxWidth: "24rem", margin: "0.5rem auto 0" }}>
                {extras.bio}
              </p>
            )}
          </motion.div>

          {/* Share consent & pending requests */}
          {!editing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
              <GlassCard hover={false} style={{ padding: "1rem 1.25rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.6)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Profile Sharing
                    </span>
                    <p style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.4)", marginTop: "0.15rem" }}>
                      {profileShareable
                        ? "Others can share your profile with friends"
                        : "Your profile cannot be shared without your approval"}
                    </p>
                  </div>
                  <button
                    onClick={toggleShareConsent}
                    style={{
                      width: "2.75rem", height: "1.5rem", borderRadius: "0.75rem",
                      background: profileShareable ? "rgba(138,196,160,0.4)" : "rgba(45,42,38,0.06)",
                      border: "none", cursor: "pointer", position: "relative",
                      transition: "background 0.2s", flexShrink: 0,
                    }}
                  >
                    <div style={{
                      width: "1.1rem", height: "1.1rem", borderRadius: "50%",
                      background: "white", position: "absolute", top: "0.2rem",
                      left: profileShareable ? "1.45rem" : "0.2rem",
                      transition: "left 0.2s",
                    }} />
                  </button>
                </div>

                {/* Pending share requests */}
                {shareRequests.length > 0 && (
                  <div style={{ marginTop: "0.75rem", borderTop: "1px solid rgba(232,224,214,0.4)", paddingTop: "0.75rem" }}>
                    <span style={{ fontSize: "0.65rem", color: "rgba(107,100,90,0.6)", textTransform: "uppercase" }}>
                      Pending Requests
                    </span>
                    {shareRequests.map((req) => (
                      <div key={req.from} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "rgba(107,100,90,0.8)" }}>
                          {req.from} wants to share your profile
                        </span>
                        <div style={{ display: "flex", gap: "0.375rem" }}>
                          <button
                            onClick={() => handleShareRequest(req.from, true)}
                            style={{
                              padding: "0.25rem 0.5rem", borderRadius: "0.375rem",
                              background: "rgba(138,196,160,0.15)", border: "1px solid rgba(138,196,160,0.3)",
                              color: "rgba(138,196,160,0.8)", fontSize: "0.65rem", cursor: "pointer",
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleShareRequest(req.from, false)}
                            style={{
                              padding: "0.25rem 0.5rem", borderRadius: "0.375rem",
                              background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.2)",
                              color: "rgba(255,80,80,0.6)", fontSize: "0.65rem", cursor: "pointer",
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}

          {/* Personalization meter */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <GlassCard hover={false} style={{ padding: "1.25rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.6)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Taste Profile Depth
                </span>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: personalization.color }}>
                  {personalization.label}
                </span>
              </div>
              <div style={{ height: "6px", borderRadius: "3px", background: "rgba(45,42,38,0.04)", overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${personalization.level}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                  style={{ height: "100%", borderRadius: "3px", background: `linear-gradient(90deg, ${personalization.color}, ${personalization.color}80)` }}
                />
              </div>
              <p style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.4)", marginTop: "0.5rem" }}>
                {personalization.level}% — {totalPicks} quiz picks
                {(profile.eventsAttended || 0) > 0 && ` · ${profile.eventsAttended} events`}
                {(profile.tasteHistory?.length || 0) > 0 && ` · ${profile.tasteHistory!.length} taste updates`}
              </p>
            </GlassCard>
          </motion.div>

          {/* Current vibes */}
          {(extras.currentSong || extras.comfortMovie || extras.comfortFood) && !editing && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <GlassCard hover={false} style={{ padding: "1.25rem", marginBottom: "1rem" }}>
                <span style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.75rem" }}>
                  Current Vibes
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {extras.currentSong && (() => {
                    const songQuery = encodeURIComponent(`${extras.currentSongArtist || ""} ${extras.currentSong}`.trim());
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {extras.currentSongImage ? (
                          <img src={extras.currentSongImage} alt="" draggable={false} style={{
                            width: "2.75rem", height: "2.75rem", borderRadius: "0.5rem", objectFit: "cover", flexShrink: 0,
                          }} />
                        ) : (
                          <span style={{ width: "2.75rem", textAlign: "center", flexShrink: 0, display: "flex", justifyContent: "center" }}><IconMusic size={24} /></span>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "0.65rem", color: "rgba(107,100,90,0.5)" }}>Stuck in my head</div>
                          <div style={{ fontSize: "0.9rem", color: "#2D2A26", fontWeight: 500 }}>
                            {extras.currentSongArtist && (
                              <span style={{ color: "rgba(107,100,90,0.8)" }}>{extras.currentSongArtist} — </span>
                            )}
                            {extras.currentSong}
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.3rem" }}>
                            <a
                              href={`https://open.spotify.com/search/${songQuery}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: "0.6rem", color: "#1DB954", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.2rem" }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                              Spotify
                            </a>
                            <a
                              href={`https://www.youtube.com/results?search_query=${songQuery}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: "0.6rem", color: "#FF0000", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.2rem" }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                              YouTube
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  {extras.comfortMovie && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      {extras.comfortMovieImage ? (
                        <img src={extras.comfortMovieImage} alt="" draggable={false} style={{
                          width: "2.75rem", height: "3.75rem", borderRadius: "0.375rem", objectFit: "cover", flexShrink: 0,
                        }} />
                      ) : (
                        <span style={{ width: "2.75rem", textAlign: "center", flexShrink: 0, display: "flex", justifyContent: "center" }}><IconTheater size={24} /></span>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.65rem", color: "rgba(107,100,90,0.5)" }}>Comfort watch</div>
                        <div style={{ fontSize: "0.9rem", color: "#2D2A26", fontWeight: 500 }}>{extras.comfortMovie}</div>
                      </div>
                    </div>
                  )}
                  {extras.comfortFood && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      {extras.comfortFoodImage ? (
                        <img src={extras.comfortFoodImage} alt="" draggable={false} style={{
                          width: "2.75rem", height: "2.75rem", borderRadius: "0.5rem", objectFit: "cover", flexShrink: 0,
                        }} />
                      ) : (
                        <span style={{ width: "2.75rem", textAlign: "center", flexShrink: 0, display: "flex", justifyContent: "center" }}><IconRestaurant size={24} /></span>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.65rem", color: "rgba(107,100,90,0.5)" }}>Comfort food</div>
                        <div style={{ fontSize: "0.9rem", color: "#2D2A26", fontWeight: 500 }}>{extras.comfortFood}</div>
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Quiz picks summary */}
          {!editing && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <GlassCard hover={false} style={{ padding: "1.25rem", marginBottom: "1rem" }}>
                <span style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.75rem" }}>
                  Taste DNA
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {CATEGORY_LABELS.map((cat, i) => {
                    const picks = profile.selections[i] || [];
                    if (picks.length === 0) return null;
                    const images = profile.entityImages?.[i] || {};
                    return (
                      <div key={i}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                          <Icon name={CATEGORY_ICONS[i]} size={16} />
                          <span style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.5)" }}>{cat}</span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", paddingLeft: "1.4rem" }}>
                          {picks.map((pick) => (
                            <div key={pick} style={{
                              display: "flex", alignItems: "center", gap: "0.4rem",
                              padding: "0.3rem 0.6rem 0.3rem 0.3rem", borderRadius: "0.5rem",
                              background: "rgba(45,42,38,0.03)", border: "1px solid rgba(232,224,214,0.5)",
                            }}>
                              {images[pick] ? (
                                <img src={images[pick]} alt="" draggable={false} style={{
                                  width: "1.75rem", height: i === 1 ? "2.25rem" : "1.75rem",
                                  borderRadius: "0.25rem", objectFit: "cover", flexShrink: 0,
                                }} />
                              ) : (
                                <span style={{ width: "1.75rem", height: "1.75rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, borderRadius: "0.25rem", background: "rgba(45,42,38,0.02)" }}>
                                  <Icon name={CATEGORY_ICONS[i]} size={14} />
                                </span>
                              )}
                              <span style={{ fontSize: "0.75rem", color: "rgba(107,100,90,0.85)" }}>{pick}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Retake quiz button */}
                <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(232,224,214,0.4)" }}>
                  <a
                    href="/quiz"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.4rem",
                      fontSize: "0.8rem", color: "rgba(107,100,90,0.6)",
                      textDecoration: "underline", textUnderlineOffset: "3px",
                    }}
                  >
                    Retake the Taste Quiz
                  </a>
                  <p style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.35)", marginTop: "0.25rem" }}>
                    Update your taste DNA with fresh picks
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Taste history */}
          {!editing && (profile.tasteHistory?.length || 0) > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <GlassCard hover={false} style={{ padding: "1.25rem", marginBottom: "1rem" }}>
                <span style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.75rem" }}>
                  Taste Evolution
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {profile.tasteHistory!.slice(-5).reverse().map((entry, i) => {
                    const fieldLabels: Record<string, string> = { currentSong: "Song", comfortMovie: "Movie", comfortFood: "Food" };
                    const date = new Date(entry.updatedAt);
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem" }}>
                        <span style={{ color: "rgba(107,100,90,0.35)", fontFamily: "monospace", fontSize: "0.65rem", flexShrink: 0 }}>
                          {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <span style={{ color: "rgba(107,100,90,0.6)" }}>{fieldLabels[entry.field] || entry.field}:</span>
                        <span style={{ color: "rgba(107,100,90,0.8)" }}>{entry.value}</span>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Edit form */}
          {editing && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard hover={false} style={{ padding: "1.5rem", marginBottom: "1rem" }}>
                {/* Name & username */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.5rem" }}>
                    Your Name
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <input
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      placeholder="First name"
                      style={{
                        flex: 1, padding: "0.6rem 0.75rem", borderRadius: "0.5rem",
                        border: "1px solid rgba(232,224,214,0.6)", background: "rgba(255,255,255,0.6)",
                        fontSize: "0.85rem", color: "rgba(45,42,38,0.9)", outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      placeholder="Last name"
                      style={{
                        flex: 1, padding: "0.6rem 0.75rem", borderRadius: "0.5rem",
                        border: "1px solid rgba(232,224,214,0.6)", background: "rgba(255,255,255,0.6)",
                        fontSize: "0.85rem", color: "rgba(45,42,38,0.9)", outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <label style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.5rem" }}>
                    Username
                  </label>
                  <UsernameInput
                    value={editUsername}
                    onChange={setEditUsername}
                    style={{
                      width: "100%", padding: "0.6rem 0.75rem", borderRadius: "0.5rem",
                      border: "1px solid rgba(232,224,214,0.6)", background: "rgba(255,255,255,0.6)",
                      fontSize: "0.85rem", color: "rgba(45,42,38,0.9)", outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Avatar picker */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.5rem" }}>
                    Profile Pic
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <button
                      onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                      style={{
                        width: "3.5rem", height: "3.5rem", borderRadius: "50%",
                        background: avatarImage ? "transparent" : "linear-gradient(135deg, rgba(232,120,138,0.2), rgba(184,160,210,0.2))",
                        border: "2px solid rgba(232,224,214,0.6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", transition: "border-color 0.2s",
                        overflow: "hidden", padding: 0, flexShrink: 0,
                        fontSize: avatarImage ? "0" : "1.75rem",
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = "rgba(232,224,214,0.8)"; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = "rgba(232,224,214,0.6)"; }}
                    >
                      {avatarImage ? (
                        <img src={avatarImage} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} draggable={false} />
                      ) : (
                        avatarEmoji ? <Icon name={avatarEmoji} size={28} /> : (user?.user_metadata?.username || profile.name || "?")[0].toUpperCase()
                      )}
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      style={{
                        padding: "0.4rem 0.75rem", borderRadius: "0.5rem",
                        background: "rgba(45,42,38,0.04)", border: "1px solid rgba(232,224,214,0.6)",
                        color: "rgba(107,100,90,0.8)", fontSize: "0.75rem",
                        cursor: uploadingImage ? "wait" : "pointer", transition: "all 0.15s",
                      }}
                    >
                      {uploadingImage ? "Processing..." : "Upload Photo"}
                    </button>
                    <input
                      ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleImageUpload} style={{ display: "none" }}
                    />
                    {avatarImage && (
                      <button
                        onClick={() => { setAvatarImage(undefined); setAvatarEmoji("music"); }}
                        style={{
                          padding: "0.4rem 0.75rem", borderRadius: "0.5rem",
                          background: "transparent", border: "1px solid rgba(255,80,80,0.2)",
                          color: "rgba(255,80,80,0.5)", fontSize: "0.75rem", cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: "0.65rem", color: "rgba(107,100,90,0.35)", marginTop: "0.4rem" }}>
                    JPEG, PNG, GIF, or WebP · Max 5 MB
                  </p>
                  {showAvatarPicker && !avatarImage && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                      style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginTop: "0.5rem" }}
                    >
                      {AVATAR_OPTIONS.map((emoji) => (
                        <button key={emoji} onClick={() => { setAvatarEmoji(emoji); setShowAvatarPicker(false); }}
                          style={{
                            width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem",
                            background: avatarEmoji === emoji ? "rgba(45,42,38,0.08)" : "rgba(45,42,38,0.02)",
                            border: avatarEmoji === emoji ? "1px solid rgba(232,224,214,0.8)" : "1px solid rgba(232,224,214,0.4)",
                            fontSize: "1.1rem", cursor: "pointer", display: "flex",
                            alignItems: "center", justifyContent: "center", transition: "all 0.15s",
                          }}
                        >{emoji}</button>
                      ))}
                    </motion.div>
                  )}
                </div>

                {/* Mood */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.5rem" }}>
                    Current Mood
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                    {MOOD_OPTIONS.map((m) => (
                      <button key={m.emoji} onClick={() => setMoodEmoji(moodEmoji === m.emoji ? "" : m.emoji)}
                        style={{
                          padding: "0.375rem 0.625rem", borderRadius: "9999px",
                          background: moodEmoji === m.emoji ? "rgba(45,42,38,0.08)" : "rgba(45,42,38,0.02)",
                          border: moodEmoji === m.emoji ? "1px solid rgba(232,224,214,0.8)" : "1px solid rgba(232,224,214,0.4)",
                          fontSize: "0.75rem", color: moodEmoji === m.emoji ? "#2D2A26" : "rgba(107,100,90,0.8)",
                          cursor: "pointer", transition: "all 0.15s",
                        }}
                      >{m.emoji} {m.label}</button>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.5rem" }}>
                    About You <span style={{ color: "rgba(107,100,90,0.35)" }}>({bio.length}/300)</span>
                  </label>
                  <textarea
                    value={bio} onChange={(e) => { if (e.target.value.length <= 300) setBio(e.target.value); }}
                    placeholder="What makes you tick? Your vibe in a few words..." rows={3}
                    style={{
                      width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem",
                      background: "rgba(45,42,38,0.03)", border: "1px solid rgba(232,224,214,0.6)",
                      color: "#2D2A26", fontSize: "0.85rem", outline: "none", resize: "none", fontFamily: "inherit",
                    }}
                  />
                </div>

                {/* Current Song — single field with iTunes search */}
                <MusicAutocompleteField
                  value={currentSong}
                  artist={currentSongArtist}
                  onChange={(v) => { setCurrentSong(v); setCurrentSongArtist(""); setCurrentSongImage(undefined); musicSearch.setQuery(v); }}
                  onSelect={(artist, track, img) => { setCurrentSongArtist(artist); setCurrentSong(track); setCurrentSongImage(img); musicSearch.setQuery(""); }}
                  placeholder="e.g. Lost On You, Espresso..."
                  results={musicSearch.results}
                  searching={musicSearch.searching}
                  selectedImage={currentSongImage}
                />

                {/* Comfort Movie — with Qloo autocomplete + poster */}
                <AutocompleteField
                  label="Comfort movie"
                  value={comfortMovie}
                  onChange={(v) => { setComfortMovie(v); setComfortMovieImage(undefined); movieSearch.setQuery(v); }}
                  onSelect={(name, img) => { setComfortMovie(name); setComfortMovieImage(img); movieSearch.setQuery(""); }}
                  placeholder="e.g. The Grand Budapest Hotel"
                  results={movieSearch.results}
                  searching={movieSearch.searching}
                  selectedImage={comfortMovieImage}
                  fallbackEmoji="theater"
                  posterStyle={true}
                />

                {/* Comfort Food — Qloo food tags + Wikipedia images */}
                <FoodAutocompleteField
                  label="Comfort food"
                  value={comfortFood}
                  onChange={(v) => { setComfortFood(v); setComfortFoodImage(undefined); foodSearch.setQuery(v); }}
                  onSelect={(name, img) => { setComfortFood(name); setComfortFoodImage(img || undefined); foodSearch.setQuery(""); }}
                  placeholder="e.g. Dal Tadka, Ramen"
                  results={foodSearch.results}
                  searching={foodSearch.searching}
                  selectedImage={comfortFoodImage}
                  style={{ marginBottom: "1.5rem" }}
                />

                {/* Orientation (private) */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.5rem" }}>
                    Orientation <span style={{ fontSize: "0.6rem", color: "rgba(107,100,90,0.35)", textTransform: "none", letterSpacing: "0" }}>(private by default)</span>
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.5rem" }}>
                    {([
                      { id: "straight" as const, label: "Straight" },
                      { id: "gay" as const, label: "Gay" },
                      { id: "lesbian" as const, label: "Lesbian" },
                      { id: "bisexual" as const, label: "Bisexual" },
                      { id: "other" as const, label: "Other" },
                      { id: "prefer-not-to-say" as const, label: "Prefer not to say" },
                    ]).map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setOrientation(orientation === o.id ? undefined : o.id)}
                        style={{
                          padding: "0.35rem 0.65rem", borderRadius: "1rem", fontSize: "0.7rem",
                          border: `1px solid ${orientation === o.id ? "rgba(232,120,138,0.4)" : "rgba(232,224,214,0.5)"}`,
                          background: orientation === o.id ? "rgba(232,120,138,0.08)" : "rgba(45,42,38,0.02)",
                          color: orientation === o.id ? "#2D2A26" : "rgba(107,100,90,0.7)",
                          cursor: "pointer", transition: "all 0.15s",
                        }}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => setOrientationVisible(!orientationVisible)}
                      style={{
                        width: "2.25rem", height: "1.25rem", borderRadius: "0.625rem",
                        background: orientationVisible ? "rgba(138,196,160,0.4)" : "rgba(45,42,38,0.06)",
                        border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s",
                      }}
                    >
                      <div style={{
                        width: "0.9rem", height: "0.9rem", borderRadius: "50%",
                        background: "white", position: "absolute", top: "0.175rem",
                        left: orientationVisible ? "1.15rem" : "0.2rem",
                        transition: "left 0.2s",
                      }} />
                    </button>
                    <span style={{ fontSize: "0.65rem", color: "rgba(107,100,90,0.5)" }}>
                      {orientationVisible ? "Visible on your profile" : "Hidden from others"}
                    </span>
                  </div>
                </div>

                {/* Region (always hidden from others) */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.5rem" }}>
                    Your Region <span style={{ fontSize: "0.6rem", color: "rgba(107,100,90,0.35)", textTransform: "none", letterSpacing: "0" }}>(always hidden from others)</span>
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <SearchableSelect
                      options={ALL_COUNTRIES.map((c) => ({ value: c.code, label: c.name, icon: c.flag }))}
                      value={regionCountry}
                      onChange={setRegionCountry}
                      placeholder="Country"
                    />
                    <input
                      type="text"
                      value={regionState}
                      onChange={(e) => setRegionState(e.target.value)}
                      placeholder="State / Region / Province"
                      style={{
                        width: "100%", padding: "0.6rem 0.75rem", borderRadius: "0.75rem",
                        background: "white", border: "1px solid rgba(232,224,214,0.6)",
                        color: "#2D2A26", fontSize: "0.85rem", outline: "none", boxSizing: "border-box",
                      }}
                    />
                    <input
                      type="text"
                      value={regionCity}
                      onChange={(e) => setRegionCity(e.target.value)}
                      placeholder="City / Town"
                      style={{
                        width: "100%", padding: "0.6rem 0.75rem", borderRadius: "0.75rem",
                        background: "white", border: "1px solid rgba(232,224,214,0.6)",
                        color: "#2D2A26", fontSize: "0.85rem", outline: "none", boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.4rem" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(107,100,90,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    <span style={{ fontSize: "0.6rem", color: "rgba(107,100,90,0.4)" }}>
                      Your location is never shared with other users
                    </span>
                  </div>
                </div>

                {/* Dietary Preferences */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.5rem" }}>
                    Dietary Preferences <span style={{ fontSize: "0.6rem", color: "rgba(107,100,90,0.35)", textTransform: "none", letterSpacing: "0" }}>(used for restaurant suggestions)</span>
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {[
                      { id: "vegetarian", label: "Vegetarian", icon: "tree" },
                      { id: "vegan", label: "Vegan", icon: "tree" },
                      { id: "gluten-free", label: "Gluten-Free", icon: "tree" },
                      { id: "halal", label: "Halal", icon: "star" },
                      { id: "kosher", label: "Kosher", icon: "star" },
                      { id: "dairy-free", label: "Dairy-Free", icon: "coffee" },
                      { id: "nut-free", label: "Nut-Free", icon: "tree" },
                      { id: "pescatarian", label: "Pescatarian", icon: "restaurant" },
                      { id: "keto", label: "Keto", icon: "tree" },
                      { id: "paleo", label: "Paleo", icon: "restaurant" },
                      { id: "jain", label: "Jain", icon: "heart" },
                      { id: "no-pork", label: "No Pork", icon: "target" },
                      { id: "no-beef", label: "No Beef", icon: "restaurant" },
                      { id: "low-sodium", label: "Low Sodium", icon: "restaurant" },
                    ].map((d) => {
                      const selected = dietaryPreferences.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          onClick={() => setDietaryPreferences(selected ? dietaryPreferences.filter((p) => p !== d.id) : [...dietaryPreferences, d.id])}
                          style={{
                            padding: "0.4rem 0.65rem", borderRadius: "2rem",
                            border: `1px solid ${selected ? "rgba(232,120,138,0.5)" : "rgba(232,224,214,0.6)"}`,
                            background: selected ? "rgba(232,120,138,0.1)" : "white",
                            color: selected ? "#E8788A" : "rgba(107,100,90,0.7)",
                            fontSize: "0.75rem", cursor: "pointer", transition: "all 0.15s",
                            display: "flex", alignItems: "center", gap: "0.3rem",
                          }}
                        >
                          <Icon name={d.icon} size={14} /> {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <GradientButton onClick={handleSave}>Save Profile</GradientButton>
                  <GradientButton variant="ghost" onClick={() => { setEditing(false); musicSearch.clear(); movieSearch.clear(); foodSearch.clear(); }}>Cancel</GradientButton>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Action buttons */}
          {!editing && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center", marginTop: "1.5rem" }}
            >
              <GradientButton onClick={() => {
                setEditFirstName(user?.user_metadata?.first_name || "");
                setEditLastName(user?.user_metadata?.last_name || "");
                setEditUsername(user?.user_metadata?.username || "");
                setEditing(true);
              }}>Edit Profile</GradientButton>
              <GradientButton variant="outline" onClick={() => { window.location.href = "/dna"; }}>View DNA Card</GradientButton>
              {user && (
                <GradientButton variant="outline" onClick={() => setShareModalOpen(true)}>Share Profile</GradientButton>
              )}
              <GradientButton variant="ghost" onClick={() => { window.location.href = "/quiz"; }}>Retake Quiz</GradientButton>
            </motion.div>
          )}
        </div>
      </div>

      {/* Lightbox for profile pic zoom */}
      <AnimatePresence>
        {lightboxOpen && hasCustomImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setLightboxOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "zoom-out", userSelect: "none", WebkitUserSelect: "none",
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              style={{ position: "relative", cursor: "default" }}
            >
              <img
                src={extras.avatarImage}
                alt="Profile"
                draggable={false}
                style={{
                  maxWidth: "min(80vw, 24rem)", maxHeight: "min(80vh, 24rem)",
                  borderRadius: "1rem", objectFit: "contain",
                  border: "2px solid rgba(232,224,214,0.6)",
                  pointerEvents: "none",
                }}
              />
              {/* Watermark overlay */}
              <div style={{
                position: "absolute", inset: 0, borderRadius: "1rem",
                display: "flex", alignItems: "center", justifyContent: "center",
                pointerEvents: "none",
              }}>
                <span style={{
                  color: "rgba(45,42,38,0.06)", fontSize: "1rem", fontWeight: 700,
                  transform: "rotate(-30deg)", letterSpacing: "0.2em",
                }}>
                  THE SWEET SPOT
                </span>
              </div>
              {/* Close button */}
              <button
                onClick={() => setLightboxOpen(false)}
                style={{
                  position: "absolute", top: "-2.5rem", right: "0",
                  background: "rgba(45,42,38,0.08)", border: "none",
                  borderRadius: "50%", width: "2rem", height: "2rem",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#2D2A26", cursor: "pointer", fontSize: "0.9rem",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3l8 8m0-8l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toast} visible={!!toast} />

      {/* Share Profile Modal */}
      {user && (
        <ShareProfileModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          profileOwnerId={user.id}
          profileOwnerUsername={user.user_metadata?.username || user.email?.split("@")[0] || "user"}
        />
      )}
    </>
  );
}

// --- Autocomplete input component for movie/generic fields ---
function AutocompleteField({
  label,
  value,
  onChange,
  onSelect,
  placeholder,
  results,
  searching,
  selectedImage,
  fallbackEmoji = "music",
  posterStyle = false,
  style: wrapperStyle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSelect: (name: string, imageUrl?: string) => void;
  placeholder: string;
  results: QlooSongResult[];
  searching: boolean;
  selectedImage?: string;
  fallbackEmoji?: string;
  posterStyle?: boolean;
  style?: React.CSSProperties;
}) {
  const [focused, setFocused] = useState(false);
  const hasSelection = !!(value && selectedImage);
  const showDropdown = focused && !hasSelection && value.length >= 2 && (results.length > 0 || searching);
  const imgW = posterStyle ? "2.5rem" : "2.25rem";
  const imgH = posterStyle ? "3.5rem" : "2.25rem";
  const imgRadius = posterStyle ? "0.375rem" : "0.5rem";

  return (
    <div style={{ marginBottom: "1rem", position: "relative", ...wrapperStyle }}>
      <label style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.5rem" }}>
        {label}
      </label>

      {/* Selected state with image */}
      {hasSelection ? (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.75rem",
          padding: "0.5rem 0.75rem", borderRadius: "0.75rem",
          background: "rgba(184,160,210,0.08)", border: "1px solid rgba(184,160,210,0.2)",
        }}>
          <img src={selectedImage} alt="" draggable={false} style={{
            width: imgW, height: imgH, borderRadius: imgRadius,
            objectFit: "cover", flexShrink: 0,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#2D2A26", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {value}
            </div>
          </div>
          <button
            onClick={() => { onChange(""); onSelect("", undefined); }}
            style={{ background: "none", border: "none", color: "rgba(107,100,90,0.6)", cursor: "pointer", fontSize: "1.1rem", padding: "0.2rem", lineHeight: 1 }}
            title="Remove"
          >×</button>
        </div>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder={placeholder}
          style={{
            width: "100%", padding: "0.65rem 1rem", borderRadius: "0.75rem",
            background: "rgba(45,42,38,0.03)", border: "1px solid rgba(232,224,214,0.6)",
            color: "#2D2A26", fontSize: "0.85rem", outline: "none", fontFamily: "inherit",
          }}
        />
      )}

      {showDropdown && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
          marginTop: "0.25rem", background: "rgba(255,255,255,0.97)",
          border: "1px solid rgba(232,224,214,0.6)",
          borderRadius: "0.75rem", overflow: "hidden", maxHeight: "16rem", overflowY: "auto",
        }}>
          {searching && results.length === 0 ? (
            <div style={{ padding: "0.75rem", textAlign: "center", color: "rgba(107,100,90,0.6)", fontSize: "0.75rem" }}>
              Searching...
            </div>
          ) : (
            results.map((r) => (
              <button
                key={r.entity_id}
                onMouseDown={(e) => { e.preventDefault(); onSelect(r.name, r.properties?.image?.url); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "0.65rem",
                  padding: "0.55rem 0.75rem", background: "transparent", border: "none",
                  borderBottom: "1px solid rgba(232,224,214,0.4)", color: "#2D2A26",
                  cursor: "pointer", textAlign: "left", transition: "background 0.15s",
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = "rgba(45,42,38,0.04)"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                {r.properties?.image?.url ? (
                  <img src={r.properties.image.url} alt="" style={{
                    width: imgW, height: imgH, borderRadius: imgRadius,
                    objectFit: "cover", flexShrink: 0,
                  }} />
                ) : (
                  <div style={{
                    width: imgW, height: imgH, borderRadius: imgRadius,
                    background: "rgba(45,42,38,0.04)", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0,
                  }}>{fallbackEmoji}</div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.name}
                  </div>
                  {r.properties?.short_description && (
                    <div style={{ fontSize: "0.65rem", color: "rgba(107,100,90,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.properties.short_description}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// --- Food autocomplete field with Wikipedia images ---
function FoodAutocompleteField({
  label,
  value,
  onChange,
  onSelect,
  placeholder,
  results,
  searching,
  selectedImage,
  style: wrapperStyle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSelect: (name: string, imageUrl?: string) => void;
  placeholder: string;
  results: FoodResult[];
  searching: boolean;
  selectedImage?: string;
  style?: React.CSSProperties;
}) {
  const [focused, setFocused] = useState(false);
  const hasSelection = !!(value && selectedImage);
  const q = value.toLowerCase().trim();

  // Quick pick suggestions that match what the user is typing
  const matchingSuggestions = q.length >= 1
    ? FOOD_SUGGESTIONS.filter((s) => s.toLowerCase().includes(q) && s.toLowerCase() !== q)
    : [];

  // Synthesize a cuisine entry at the top if the typed text matches a cuisine flag
  const typedFlag = q.length >= 2 ? getCuisineFlag(value) : null;

  const showDropdown = focused && !hasSelection && value.length >= 2 && (
    results.length > 0 || searching || matchingSuggestions.length > 0 || typedFlag
  );

  return (
    <div style={{ marginBottom: "1rem", position: "relative", ...wrapperStyle }}>
      <label style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.5rem" }}>
        {label}
      </label>

      {/* Selected state with flag/image */}
      {hasSelection ? (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.75rem",
          padding: "0.5rem 0.75rem", borderRadius: "0.75rem",
          background: "rgba(140,191,212,0.08)", border: "1px solid rgba(140,191,212,0.2)",
        }}>
          <img src={selectedImage} alt="" draggable={false} style={{
            width: "2.5rem", height: "2.5rem", borderRadius: "0.5rem",
            objectFit: "cover", flexShrink: 0,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#2D2A26", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {getCuisineFlag(value) ? `${getCuisineFlag(value)} ` : ""}{value}
            </div>
          </div>
          <button
            onClick={() => { onChange(""); onSelect("", undefined); }}
            style={{ background: "none", border: "none", color: "rgba(107,100,90,0.6)", cursor: "pointer", fontSize: "1.1rem", padding: "0.2rem", lineHeight: 1 }}
          >×</button>
        </div>
      ) : value && !selectedImage && getCuisineFlag(value) ? (
        /* Selected without image — show flag badge */
        <div style={{
          display: "flex", alignItems: "center", gap: "0.75rem",
          padding: "0.5rem 0.75rem", borderRadius: "0.75rem",
          background: "rgba(140,191,212,0.08)", border: "1px solid rgba(140,191,212,0.2)",
        }}>
          <div style={{
            width: "2.5rem", height: "2.5rem", borderRadius: "0.5rem",
            background: "rgba(45,42,38,0.04)", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0,
          }}>{getCuisineFlag(value)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#2D2A26" }}>{value}</div>
          </div>
          <button
            onClick={() => { onChange(""); onSelect("", undefined); }}
            style={{ background: "none", border: "none", color: "rgba(107,100,90,0.6)", cursor: "pointer", fontSize: "1.1rem", padding: "0.2rem", lineHeight: 1 }}
          >×</button>
        </div>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder={placeholder}
          style={{
            width: "100%", padding: "0.65rem 1rem", borderRadius: "0.75rem",
            background: "rgba(45,42,38,0.03)", border: "1px solid rgba(232,224,214,0.6)",
            color: "#2D2A26", fontSize: "0.85rem", outline: "none", fontFamily: "inherit",
          }}
        />
      )}

      {/* Quick pick chips when input is empty/focused */}
      {focused && !value && !hasSelection && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.5rem" }}>
          {FOOD_SUGGESTIONS.slice(0, 12).map((s) => {
            const flag = getCuisineFlag(s);
            return (
              <button
                key={s}
                onMouseDown={(e) => { e.preventDefault(); onSelect(s, undefined); }}
                style={{
                  padding: "0.3rem 0.6rem", borderRadius: "9999px",
                  background: "rgba(45,42,38,0.03)", border: "1px solid rgba(232,224,214,0.6)",
                  color: "rgba(107,100,90,0.9)", fontSize: "0.75rem", cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = "rgba(140,191,212,0.1)"; e.currentTarget.style.borderColor = "rgba(140,191,212,0.3)"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "rgba(45,42,38,0.03)"; e.currentTarget.style.borderColor = "rgba(232,224,214,0.6)"; }}
              >{flag ? `${flag} ` : ""}{s}</button>
            );
          })}
        </div>
      )}

      {showDropdown && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
          marginTop: "0.25rem", background: "rgba(255,255,255,0.97)",
          border: "1px solid rgba(232,224,214,0.6)",
          borderRadius: "0.75rem", overflow: "hidden", maxHeight: "16rem", overflowY: "auto",
        }}>
          {/* Synthesized cuisine entry */}
          {typedFlag && (
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                // Capitalize first letter
                const name = value.charAt(0).toUpperCase() + value.slice(1);
                onSelect(name, undefined);
              }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: "0.65rem",
                padding: "0.6rem 0.75rem", background: "rgba(140,191,212,0.06)", border: "none",
                borderBottom: "1px solid rgba(232,224,214,0.5)", color: "#2D2A26",
                cursor: "pointer", textAlign: "left",
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = "rgba(140,191,212,0.12)"; }}
              onMouseOut={(e) => { e.currentTarget.style.background = "rgba(140,191,212,0.06)"; }}
            >
              <span style={{ fontSize: "1.4rem", width: "2rem", textAlign: "center", flexShrink: 0 }}>{typedFlag}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{value.charAt(0).toUpperCase() + value.slice(1)}</div>
                <div style={{ fontSize: "0.6rem", color: "rgba(140,191,212,0.6)" }}>Cuisine type</div>
              </div>
            </button>
          )}

          {/* Matching quick picks */}
          {matchingSuggestions.slice(0, 3).map((s) => {
            const flag = getCuisineFlag(s);
            return (
              <button
                key={`qp-${s}`}
                onMouseDown={(e) => { e.preventDefault(); onSelect(s, undefined); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "0.65rem",
                  padding: "0.5rem 0.75rem", background: "transparent", border: "none",
                  borderBottom: "1px solid rgba(232,224,214,0.4)", color: "#2D2A26",
                  cursor: "pointer", textAlign: "left", transition: "background 0.15s",
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = "rgba(45,42,38,0.04)"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: "1.1rem", width: "2rem", textAlign: "center", flexShrink: 0 }}>{flag || "restaurant"}</span>
                <div style={{ fontSize: "0.8rem", fontWeight: 500 }}>{s}</div>
                <span style={{ fontSize: "0.55rem", color: "rgba(107,100,90,0.4)", marginLeft: "auto", flexShrink: 0 }}>Quick pick</span>
              </button>
            );
          })}

          {/* Qloo search results */}
          {searching && results.length === 0 && !typedFlag && matchingSuggestions.length === 0 ? (
            <div style={{ padding: "0.75rem", textAlign: "center", color: "rgba(107,100,90,0.6)", fontSize: "0.75rem" }}>
              Searching foods...
            </div>
          ) : (
            results.map((r) => {
              const flag = getCuisineFlag(r.name);
              return (
                <button
                  key={r.id}
                  onMouseDown={(e) => { e.preventDefault(); onSelect(r.name, r.imageUrl); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "0.65rem",
                    padding: "0.55rem 0.75rem", background: "transparent", border: "none",
                    borderBottom: "1px solid rgba(232,224,214,0.4)", color: "#2D2A26",
                    cursor: "pointer", textAlign: "left", transition: "background 0.15s",
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "rgba(45,42,38,0.04)"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  {r.imageUrl ? (
                    <img src={r.imageUrl} alt="" style={{
                      width: "2rem", height: "2rem", borderRadius: "0.375rem",
                      objectFit: "cover", flexShrink: 0,
                    }} />
                  ) : (
                    <span style={{ fontSize: "1.1rem", width: "2rem", textAlign: "center", flexShrink: 0 }}>{flag || "restaurant"}</span>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {flag && !r.imageUrl ? `${flag} ` : ""}{r.name}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// --- Music autocomplete field (iTunes song search) ---
// Flow: user types → sees songs from iTunes with artist + artwork
// Pick a song → auto-fills artist, track name, and cover art in one click
function MusicAutocompleteField({
  value,
  artist,
  onChange,
  onSelect,
  placeholder,
  results,
  searching,
  selectedImage,
}: {
  value: string;
  artist: string;
  onChange: (v: string) => void;
  onSelect: (artist: string, track: string, imageUrl: string) => void;
  placeholder: string;
  results: MusicResult[];
  searching: boolean;
  selectedImage?: string;
}) {
  const [focused, setFocused] = useState(false);
  const hasSelection = !!(artist && value);
  const showDropdown = focused && !hasSelection && value.length >= 2 && (results.length > 0 || searching);

  return (
    <div style={{ marginBottom: "1rem", position: "relative" }}>
      <label style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.5rem" }}>
        Song stuck in your head
      </label>

      {/* Show selected song with artist + artwork */}
      {hasSelection && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.75rem",
          padding: "0.6rem 0.75rem", borderRadius: "0.75rem",
          background: "rgba(232,120,138,0.08)", border: "1px solid rgba(232,120,138,0.2)",
        }}>
          {selectedImage ? (
            <img src={selectedImage} alt="" style={{
              width: "3rem", height: "3rem", borderRadius: "0.5rem", objectFit: "cover", flexShrink: 0,
            }} />
          ) : (
            <div style={{
              width: "3rem", height: "3rem", borderRadius: "0.5rem",
              background: "rgba(232,120,138,0.15)", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0,
            }}><IconMusic size={16} /></div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#2D2A26", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {value}
            </div>
            <div style={{ fontSize: "0.75rem", color: "rgba(232,120,138,0.8)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {artist}
            </div>
          </div>
          <button
            onClick={() => { onSelect("", "", ""); onChange(""); }}
            style={{ background: "none", border: "none", color: "rgba(107,100,90,0.6)", cursor: "pointer", fontSize: "1.1rem", padding: "0.2rem", lineHeight: 1 }}
            title="Remove"
          >×</button>
        </div>
      )}

      {!hasSelection && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder={placeholder}
          style={{
            width: "100%", padding: "0.65rem 1rem", borderRadius: "0.75rem",
            background: "rgba(45,42,38,0.03)", border: "1px solid rgba(232,224,214,0.6)",
            color: "#2D2A26", fontSize: "0.85rem", outline: "none", fontFamily: "inherit",
          }}
        />
      )}

      {showDropdown && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
          marginTop: "0.25rem", background: "rgba(255,255,255,0.97)",
          border: "1px solid rgba(232,224,214,0.6)",
          borderRadius: "0.75rem", overflow: "hidden", maxHeight: "16rem", overflowY: "auto",
        }}>
          {searching && results.length === 0 ? (
            <div style={{ padding: "0.75rem", textAlign: "center", color: "rgba(107,100,90,0.6)", fontSize: "0.75rem" }}>
              Searching songs...
            </div>
          ) : (
            results.map((r, i) => (
              <button
                key={`song-${r.entityId}-${i}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(r.artistName, r.trackName, r.artworkUrl);
                }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "0.65rem",
                  padding: "0.55rem 0.75rem", background: "transparent", border: "none",
                  borderBottom: "1px solid rgba(232,224,214,0.4)", color: "#2D2A26",
                  cursor: "pointer", textAlign: "left", transition: "background 0.15s",
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = "rgba(45,42,38,0.04)"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                {r.artworkUrl ? (
                  <img src={r.artworkUrl} alt="" style={{
                    width: "2.5rem", height: "2.5rem", borderRadius: "0.375rem",
                    objectFit: "cover", flexShrink: 0,
                  }} />
                ) : (
                  <div style={{
                    width: "2.5rem", height: "2.5rem", borderRadius: "0.375rem",
                    background: "rgba(45,42,38,0.04)", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: "0.9rem", flexShrink: 0,
                  }}><IconMusic size={16} /></div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.trackName}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "rgba(232,120,138,0.7)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.artistName}
                  </div>
                  {r.description && (
                    <div style={{ fontSize: "0.6rem", color: "rgba(107,100,90,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.description}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
