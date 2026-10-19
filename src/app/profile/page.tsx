"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Navbar } from "@/components/layout/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Toast } from "@/components/ui/Toast";
import { moderateName, moderateBio, moderateImageFile, resizeImage } from "@/lib/moderation";
import type { LocalProfile, ProfileExtras } from "@/hooks/useLocalProfile";

const AVATAR_OPTIONS = [
  "🎧", "🎤", "🎸", "🎬", "🍕", "🌮", "🍣", "🎨",
  "🌊", "🔥", "🌸", "🦋", "🐱", "🐶", "🌙", "☀️",
  "💎", "🎯", "🧊", "🪩", "🫧", "🍷", "🌿", "🪐",
];

const MOOD_OPTIONS = [
  { emoji: "😌", label: "Chill" },
  { emoji: "🔥", label: "Hyped" },
  { emoji: "🥰", label: "Romantic" },
  { emoji: "🤪", label: "Chaotic" },
  { emoji: "😎", label: "Cool" },
  { emoji: "🥱", label: "Low-key" },
  { emoji: "✨", label: "Magical" },
  { emoji: "🫠", label: "Melting" },
  { emoji: "💀", label: "Dead" },
  { emoji: "🤓", label: "Nerdy" },
  { emoji: "👻", label: "Ghosting" },
  { emoji: "🦊", label: "Foxy" },
];

const CATEGORY_LABELS = ["Music", "Movies & TV", "Dining", "Nightlife & Vibes", "Brands & Style"];
const CATEGORY_ICONS = ["🎵", "🎬", "🍽️", "🌙", "✨"];

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
  if (pct < 25) return { level: pct, label: "Getting Started", color: "#f97316" };
  if (pct < 50) return { level: pct, label: "Taking Shape", color: "#ec4899" };
  if (pct < 75) return { level: pct, label: "Well Defined", color: "#8b5cf6" };
  return { level: pct, label: "Fully Realized", color: "#06b6d4" };
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
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState("");

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Share consent state
  const [shareRequests, setShareRequests] = useState<{ from: string; timestamp: string }[]>([]);

  // Edit state
  const [avatarEmoji, setAvatarEmoji] = useState("🎧");
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const saved = localStorage.getItem("sweetspot_profile");
    if (saved) {
      try {
        const p: LocalProfile = JSON.parse(saved);
        setProfile(p);
        setProfileShareable(p.extras?.shareConsent ?? false);
        if (p.extras) {
          setAvatarEmoji(p.extras.avatarEmoji || "🎧");
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
        }
      } catch {
        // ignore
      }
    }

    // Load pending share requests
    const reqs = localStorage.getItem("sweetspot_share_requests");
    if (reqs) {
      try { setShareRequests(JSON.parse(reqs)); } catch { /* ignore */ }
    }
  }, []);

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
    localStorage.setItem("sweetspot_profile", JSON.stringify(updated));
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
    localStorage.setItem("sweetspot_profile", JSON.stringify(updated));
    setProfile(updated);
    setEditing(false);
    musicSearch.clear();
    movieSearch.clear();
    foodSearch.clear();
    showToast("Profile updated!");
  };

  if (!profile) {
    return (
      <>
        <AnimatedBackground />
        <Navbar />
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "6rem 2rem 2rem" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👤</div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem" }}>No Profile Yet</h2>
            <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: "1.5rem" }}>Take the quiz to create your taste profile.</p>
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
                  border: "2px solid rgba(255,255,255,0.15)",
                  overflow: "hidden", margin: "0 auto 1rem",
                  cursor: "pointer", padding: 0, background: "transparent",
                  transition: "transform 0.2s, border-color 0.2s",
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
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
                background: "linear-gradient(135deg, rgba(249,115,22,0.2), rgba(236,72,153,0.2))",
                border: "2px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "2.5rem", margin: "0 auto 1rem",
              }}>
                {extras.avatarEmoji || profile.name[0]}
              </div>
            )}

            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.25rem" }}>
              {profile.name}
            </h1>
            {extras.moodEmoji && (
              <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>
                {MOOD_OPTIONS.find((m) => m.emoji === extras.moodEmoji)?.label || ""} {extras.moodEmoji}
              </span>
            )}
            {extras.bio && (
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.875rem", marginTop: "0.5rem", maxWidth: "24rem", margin: "0.5rem auto 0" }}>
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
                    <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      Profile Sharing
                    </span>
                    <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.2)", marginTop: "0.15rem" }}>
                      {profileShareable
                        ? "Others can share your profile with friends"
                        : "Your profile cannot be shared without your approval"}
                    </p>
                  </div>
                  <button
                    onClick={toggleShareConsent}
                    style={{
                      width: "2.75rem", height: "1.5rem", borderRadius: "0.75rem",
                      background: profileShareable ? "rgba(132,204,22,0.4)" : "rgba(255,255,255,0.08)",
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
                  <div style={{ marginTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.75rem" }}>
                    <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                      Pending Requests
                    </span>
                    {shareRequests.map((req) => (
                      <div key={req.from} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
                          {req.from} wants to share your profile
                        </span>
                        <div style={{ display: "flex", gap: "0.375rem" }}>
                          <button
                            onClick={() => handleShareRequest(req.from, true)}
                            style={{
                              padding: "0.25rem 0.5rem", borderRadius: "0.375rem",
                              background: "rgba(132,204,22,0.15)", border: "1px solid rgba(132,204,22,0.3)",
                              color: "rgba(132,204,22,0.8)", fontSize: "0.65rem", cursor: "pointer",
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
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Taste Profile Depth
                </span>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: personalization.color }}>
                  {personalization.label}
                </span>
              </div>
              <div style={{ height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${personalization.level}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                  style={{ height: "100%", borderRadius: "3px", background: `linear-gradient(90deg, ${personalization.color}, ${personalization.color}80)` }}
                />
              </div>
              <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.2)", marginTop: "0.5rem" }}>
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
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.75rem" }}>
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
                          <span style={{ fontSize: "1.5rem", width: "2.75rem", textAlign: "center", flexShrink: 0 }}>🎵</span>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)" }}>Stuck in my head</div>
                          <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
                            {extras.currentSongArtist && (
                              <span style={{ color: "rgba(255,255,255,0.5)" }}>{extras.currentSongArtist} — </span>
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
                        <span style={{ fontSize: "1.5rem", width: "2.75rem", textAlign: "center", flexShrink: 0 }}>🎬</span>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)" }}>Comfort watch</div>
                        <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{extras.comfortMovie}</div>
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
                        <span style={{ fontSize: "1.5rem", width: "2.75rem", textAlign: "center", flexShrink: 0 }}>🍽️</span>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)" }}>Comfort food</div>
                        <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{extras.comfortFood}</div>
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
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.75rem" }}>
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
                          <span style={{ fontSize: "0.9rem" }}>{CATEGORY_ICONS[i]}</span>
                          <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)" }}>{cat}</span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", paddingLeft: "1.4rem" }}>
                          {picks.map((pick) => (
                            <div key={pick} style={{
                              display: "flex", alignItems: "center", gap: "0.4rem",
                              padding: "0.3rem 0.6rem 0.3rem 0.3rem", borderRadius: "0.5rem",
                              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                            }}>
                              {images[pick] ? (
                                <img src={images[pick]} alt="" draggable={false} style={{
                                  width: "1.75rem", height: i === 1 ? "2.25rem" : "1.75rem",
                                  borderRadius: "0.25rem", objectFit: "cover", flexShrink: 0,
                                }} />
                              ) : (
                                <span style={{ width: "1.75rem", height: "1.75rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", flexShrink: 0, borderRadius: "0.25rem", background: "rgba(255,255,255,0.03)" }}>
                                  {CATEGORY_ICONS[i]}
                                </span>
                              )}
                              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)" }}>{pick}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Taste history */}
          {!editing && (profile.tasteHistory?.length || 0) > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <GlassCard hover={false} style={{ padding: "1.25rem", marginBottom: "1rem" }}>
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.75rem" }}>
                  Taste Evolution
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {profile.tasteHistory!.slice(-5).reverse().map((entry, i) => {
                    const fieldLabels: Record<string, string> = { currentSong: "Song", comfortMovie: "Movie", comfortFood: "Food" };
                    const date = new Date(entry.updatedAt);
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem" }}>
                        <span style={{ color: "rgba(255,255,255,0.15)", fontFamily: "monospace", fontSize: "0.65rem", flexShrink: 0 }}>
                          {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.3)" }}>{fieldLabels[entry.field] || entry.field}:</span>
                        <span style={{ color: "rgba(255,255,255,0.5)" }}>{entry.value}</span>
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
                {/* Avatar picker */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.5rem" }}>
                    Profile Pic
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <button
                      onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                      style={{
                        width: "3.5rem", height: "3.5rem", borderRadius: "50%",
                        background: avatarImage ? "transparent" : "linear-gradient(135deg, rgba(249,115,22,0.2), rgba(236,72,153,0.2))",
                        border: "2px solid rgba(255,255,255,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", transition: "border-color 0.2s",
                        overflow: "hidden", padding: 0, flexShrink: 0,
                        fontSize: avatarImage ? "0" : "1.75rem",
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                    >
                      {avatarImage ? (
                        <img src={avatarImage} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} draggable={false} />
                      ) : (
                        avatarEmoji || profile.name[0]
                      )}
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      style={{
                        padding: "0.4rem 0.75rem", borderRadius: "0.5rem",
                        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.5)", fontSize: "0.75rem",
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
                        onClick={() => { setAvatarImage(undefined); setAvatarEmoji("🎧"); }}
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
                  <p style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.15)", marginTop: "0.4rem" }}>
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
                            background: avatarEmoji === emoji ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                            border: avatarEmoji === emoji ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.05)",
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
                  <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.5rem" }}>
                    Current Mood
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                    {MOOD_OPTIONS.map((m) => (
                      <button key={m.emoji} onClick={() => setMoodEmoji(moodEmoji === m.emoji ? "" : m.emoji)}
                        style={{
                          padding: "0.375rem 0.625rem", borderRadius: "9999px",
                          background: moodEmoji === m.emoji ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                          border: moodEmoji === m.emoji ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.05)",
                          fontSize: "0.75rem", color: moodEmoji === m.emoji ? "white" : "rgba(255,255,255,0.4)",
                          cursor: "pointer", transition: "all 0.15s",
                        }}
                      >{m.emoji} {m.label}</button>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.5rem" }}>
                    About You <span style={{ color: "rgba(255,255,255,0.15)" }}>({bio.length}/300)</span>
                  </label>
                  <textarea
                    value={bio} onChange={(e) => { if (e.target.value.length <= 300) setBio(e.target.value); }}
                    placeholder="What makes you tick? Your vibe in a few words..." rows={3}
                    style={{
                      width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                      color: "white", fontSize: "0.85rem", outline: "none", resize: "none", fontFamily: "inherit",
                    }}
                  />
                </div>

                {/* Current Song — single field with iTunes search */}
                <MusicAutocompleteField
                  value={currentSong}
                  artist={currentSongArtist}
                  onChange={(v) => { setCurrentSong(v); setCurrentSongArtist(""); setCurrentSongImage(undefined); musicSearch.setQuery(v); }}
                  onSelect={(artist, track, img) => { setCurrentSongArtist(artist); setCurrentSong(track); setCurrentSongImage(img); musicSearch.clear(); }}
                  placeholder="e.g. Lost On You, Espresso..."
                  results={musicSearch.results}
                  searching={musicSearch.searching}
                  selectedImage={currentSongImage}
                />

                {/* Comfort Movie — with Qloo autocomplete */}
                <AutocompleteField
                  label="🎬 Comfort movie"
                  value={comfortMovie}
                  onChange={(v) => { setComfortMovie(v); setComfortMovieImage(undefined); movieSearch.setQuery(v); }}
                  onSelect={(name, img) => { setComfortMovie(name); setComfortMovieImage(img); movieSearch.clear(); }}
                  placeholder="e.g. The Grand Budapest Hotel"
                  results={movieSearch.results}
                  searching={movieSearch.searching}
                  selectedImage={comfortMovieImage}
                />

                {/* Comfort Food — Qloo food tags + Wikipedia images */}
                <FoodAutocompleteField
                  label="🍽️ Comfort food"
                  value={comfortFood}
                  onChange={(v) => { setComfortFood(v); setComfortFoodImage(undefined); foodSearch.setQuery(v); }}
                  onSelect={(name, img) => { setComfortFood(name); setComfortFoodImage(img); foodSearch.clear(); }}
                  placeholder="e.g. Dal Tadka, Ramen"
                  results={foodSearch.results}
                  searching={foodSearch.searching}
                  selectedImage={comfortFoodImage}
                  style={{ marginBottom: "1.5rem" }}
                />

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
              <GradientButton onClick={() => setEditing(true)}>Edit Profile</GradientButton>
              <GradientButton variant="outline" onClick={() => { window.location.href = "/dna"; }}>View DNA Card</GradientButton>
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
                  border: "2px solid rgba(255,255,255,0.1)",
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
                  color: "rgba(255,255,255,0.08)", fontSize: "1rem", fontWeight: 700,
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
                  background: "rgba(255,255,255,0.1)", border: "none",
                  borderRadius: "50%", width: "2rem", height: "2rem",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", cursor: "pointer", fontSize: "0.9rem",
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
    </>
  );
}

// --- Autocomplete input component for song/movie/food fields ---
function AutocompleteField({
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
  results: QlooSongResult[];
  searching: boolean;
  selectedImage?: string;
  style?: React.CSSProperties;
}) {
  const [focused, setFocused] = useState(false);
  const showDropdown = focused && value.length >= 2 && (results.length > 0 || searching);

  return (
    <div style={{ marginBottom: "1rem", position: "relative", ...wrapperStyle }}>
      <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.5rem" }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {selectedImage && (
          <img src={selectedImage} alt="" draggable={false} style={{
            width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem",
            objectFit: "cover", flexShrink: 0,
          }} />
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder={placeholder}
          style={{
            width: "100%", padding: "0.65rem 1rem", borderRadius: "0.75rem",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "white", fontSize: "0.85rem", outline: "none", fontFamily: "inherit",
          }}
        />
      </div>
      {searching && (
        <span style={{ position: "absolute", right: "0.75rem", top: "2.1rem", fontSize: "0.7rem", color: "rgba(255,255,255,0.2)" }}>...</span>
      )}

      {showDropdown && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
          marginTop: "0.25rem", background: "rgba(15,15,22,0.95)",
          backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "0.75rem", overflow: "hidden", maxHeight: "12rem", overflowY: "auto",
        }}>
          {searching && results.length === 0 ? (
            <div style={{ padding: "0.75rem", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}>
              Searching...
            </div>
          ) : (
            results.map((r) => (
              <button
                key={r.entity_id}
                onMouseDown={(e) => { e.preventDefault(); onSelect(r.name, r.properties?.image?.url); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "0.6rem",
                  padding: "0.6rem 0.75rem", background: "transparent", border: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.04)", color: "white",
                  cursor: "pointer", textAlign: "left", transition: "background 0.15s",
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                {r.properties?.image?.url ? (
                  <img src={r.properties.image.url} alt="" style={{
                    width: "2rem", height: "2rem", borderRadius: "0.375rem",
                    objectFit: "cover", flexShrink: 0,
                  }} />
                ) : (
                  <div style={{
                    width: "2rem", height: "2rem", borderRadius: "0.375rem",
                    background: "rgba(255,255,255,0.05)", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0,
                  }}>🎵</div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.name}
                  </div>
                  {r.properties?.short_description && (
                    <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.properties.short_description}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: "0.55rem", color: "rgba(249,115,22,0.5)", flexShrink: 0 }}>Qloo</span>
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
  const showDropdown = focused && value.length >= 2 && (results.length > 0 || searching);

  return (
    <div style={{ marginBottom: "1rem", position: "relative", ...wrapperStyle }}>
      <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.5rem" }}>
        {label}
      </label>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {selectedImage && (
          <img src={selectedImage} alt="" draggable={false} style={{
            width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem",
            objectFit: "cover", flexShrink: 0,
          }} />
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder={placeholder}
          style={{
            width: "100%", padding: "0.65rem 1rem", borderRadius: "0.75rem",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "white", fontSize: "0.85rem", outline: "none", fontFamily: "inherit",
          }}
        />
      </div>
      {searching && (
        <span style={{ position: "absolute", right: "0.75rem", top: "2.1rem", fontSize: "0.7rem", color: "rgba(255,255,255,0.2)" }}>...</span>
      )}

      {showDropdown && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
          marginTop: "0.25rem", background: "rgba(15,15,22,0.95)",
          backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "0.75rem", overflow: "hidden", maxHeight: "12rem", overflowY: "auto",
        }}>
          {searching && results.length === 0 ? (
            <div style={{ padding: "0.75rem", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}>
              Searching foods...
            </div>
          ) : (
            results.map((r) => (
              <button
                key={r.id}
                onMouseDown={(e) => { e.preventDefault(); onSelect(r.name, r.imageUrl); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "0.6rem",
                  padding: "0.6rem 0.75rem", background: "transparent", border: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.04)", color: "white",
                  cursor: "pointer", textAlign: "left", transition: "background 0.15s",
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                {r.imageUrl ? (
                  <img src={r.imageUrl} alt="" style={{
                    width: "2rem", height: "2rem", borderRadius: "0.375rem",
                    objectFit: "cover", flexShrink: 0,
                  }} />
                ) : (
                  <div style={{
                    width: "2rem", height: "2rem", borderRadius: "0.375rem",
                    background: "rgba(255,255,255,0.05)", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0,
                  }}>🍽️</div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.name}
                  </div>
                </div>
                <span style={{ fontSize: "0.55rem", color: "rgba(139,92,246,0.5)", flexShrink: 0 }}>Qloo</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// --- Music autocomplete field (single input, Qloo artists + albums) ---
// Flow: user types → sees artists and albums from Qloo
// Pick an artist → sets artist name + image, input clears for song title
// Pick an album → sets song name + cover art
// Result: "Artist — Song" with artwork, Spotify/YouTube links on profile
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
  const showDropdown = focused && value.length >= 2 && (results.length > 0 || searching);

  return (
    <div style={{ marginBottom: "1rem", position: "relative" }}>
      <label style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: "0.5rem" }}>
        🎵 Song stuck in your head
      </label>

      {/* Show selected artist badge above input */}
      {artist && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.35rem",
          padding: "0.2rem 0.5rem 0.2rem 0.25rem", borderRadius: "9999px",
          background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)",
          fontSize: "0.7rem", color: "#f97316", marginBottom: "0.4rem",
        }}>
          {selectedImage && (
            <img src={selectedImage} alt="" style={{
              width: "1.1rem", height: "1.1rem", borderRadius: "50%", objectFit: "cover",
            }} />
          )}
          {artist}
          <button
            onClick={() => onSelect("", "", "")}
            style={{ background: "none", border: "none", color: "rgba(249,115,22,0.5)", cursor: "pointer", fontSize: "0.8rem", padding: "0 0.1rem", lineHeight: 1 }}
          >×</button>
        </div>
      )}

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        placeholder={artist ? "Now type the song name..." : placeholder}
        style={{
          width: "100%", padding: "0.65rem 1rem", borderRadius: "0.75rem",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          color: "white", fontSize: "0.85rem", outline: "none", fontFamily: "inherit",
        }}
      />

      {showDropdown && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
          marginTop: "0.25rem", background: "rgba(15,15,22,0.95)",
          backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "0.75rem", overflow: "hidden", maxHeight: "16rem", overflowY: "auto",
        }}>
          {searching && results.length === 0 ? (
            <div style={{ padding: "0.75rem", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}>
              Searching...
            </div>
          ) : (
            <>
              {/* Artist results */}
              {results.filter((r) => r.type === "artist").length > 0 && (
                <div style={{ padding: "0.4rem 0.75rem 0.2rem", fontSize: "0.6rem", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Artists
                </div>
              )}
              {results.filter((r) => r.type === "artist").map((r, i) => (
                <button
                  key={`artist-${r.entityId}-${i}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    // Selecting artist: set artist name + image, clear song input for typing
                    onSelect(r.artistName, "", r.artworkUrl);
                  }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "0.6rem",
                    padding: "0.5rem 0.75rem", background: "transparent", border: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.04)", color: "white",
                    cursor: "pointer", textAlign: "left", transition: "background 0.15s",
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  {r.artworkUrl ? (
                    <img src={r.artworkUrl} alt="" style={{
                      width: "2rem", height: "2rem", borderRadius: "50%",
                      objectFit: "cover", flexShrink: 0,
                    }} />
                  ) : (
                    <div style={{
                      width: "2rem", height: "2rem", borderRadius: "50%",
                      background: "rgba(249,115,22,0.15)", display: "flex",
                      alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0,
                    }}>🎤</div>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.artistName}
                    </div>
                    {r.description && (
                      <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.description}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: "0.55rem", color: "rgba(249,115,22,0.4)", flexShrink: 0 }}>Artist</span>
                </button>
              ))}

              {/* Album/Song results */}
              {results.filter((r) => r.type === "album").length > 0 && (
                <div style={{ padding: "0.4rem 0.75rem 0.2rem", fontSize: "0.6rem", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Songs / Albums
                </div>
              )}
              {results.filter((r) => r.type === "album").map((r, i) => (
                <button
                  key={`album-${r.entityId}-${i}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    // Selecting album: set song name + cover art, keep existing artist
                    onSelect(artist, r.trackName, r.artworkUrl);
                  }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "0.6rem",
                    padding: "0.5rem 0.75rem", background: "transparent", border: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.04)", color: "white",
                    cursor: "pointer", textAlign: "left", transition: "background 0.15s",
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  {r.artworkUrl ? (
                    <img src={r.artworkUrl} alt="" style={{
                      width: "2rem", height: "2rem", borderRadius: "0.375rem",
                      objectFit: "cover", flexShrink: 0,
                    }} />
                  ) : (
                    <div style={{
                      width: "2rem", height: "2rem", borderRadius: "0.375rem",
                      background: "rgba(255,255,255,0.05)", display: "flex",
                      alignItems: "center", justifyContent: "center", fontSize: "0.8rem", flexShrink: 0,
                    }}>💿</div>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.trackName}
                    </div>
                  </div>
                  <span style={{ fontSize: "0.55rem", color: "rgba(139,92,246,0.4)", flexShrink: 0 }}>Song</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
