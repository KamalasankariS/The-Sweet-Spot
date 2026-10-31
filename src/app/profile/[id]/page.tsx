"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Navbar } from "@/components/layout/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "next/navigation";
import Link from "next/link";

const CATEGORY_LABELS = ["Music", "Movies & TV", "Dining", "Nightlife & Vibes", "Brands & Style"];
const CATEGORY_ICONS = ["\uD83C\uDFB5", "\uD83C\uDFAC", "\uD83C\uDF7D\uFE0F", "\uD83C\uDF19", "\u2728"];

interface PublicProfile {
  id: string;
  name: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  selections: Record<string, string[]>;
  extras: {
    avatarEmoji?: string;
    avatarImage?: string;
    moodEmoji?: string;
    bio?: string;
    currentSongArtist?: string;
    currentSong?: string;
    comfortMovie?: string;
    comfortFood?: string;
  };
}

export default function PublicProfilePage() {
  return (
    <Suspense>
      <PublicProfileInner />
    </Suspense>
  );
}

function PublicProfileInner() {
  const params = useParams();
  const profileId = params.id as string;
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!supabase || !profileId) { setLoading(false); return; }

    async function load() {
      const { data, error } = await supabase!
        .from("profiles")
        .select("id, name, username, first_name, last_name, selections, extras")
        .eq("id", profileId)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setProfile(data as PublicProfile);
      }
      setLoading(false);
    }

    load();
  }, [supabase, profileId]);

  // Redirect to own profile if viewing self
  const isOwnProfile = user?.id === profileId;

  if (loading) {
    return (
      <main style={{ minHeight: "100vh", position: "relative" }}>
        <AnimatedBackground />
        <Navbar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <p style={{ color: "rgba(107,100,90,0.5)", fontSize: "0.9rem" }}>Loading profile...</p>
        </div>
      </main>
    );
  }

  if (notFound || !profile) {
    return (
      <main style={{ minHeight: "100vh", position: "relative" }}>
        <AnimatedBackground />
        <Navbar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: "1rem" }}>
          <p style={{ color: "rgba(107,100,90,0.6)", fontSize: "1rem" }}>Profile not found</p>
          <Link href="/" style={{ color: "rgba(184,160,210,0.9)", fontSize: "0.85rem" }}>Go home</Link>
        </div>
      </main>
    );
  }

  const extras = profile.extras || {};
  const selections = profile.selections || {};
  const displayName = profile.username || profile.name;
  const realName = profile.first_name && profile.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : null;

  return (
    <main style={{ minHeight: "100vh", position: "relative" }}>
      <AnimatedBackground />
      <Navbar />

      <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "6rem 1rem 3rem" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: "2rem" }}
        >
          {extras.avatarImage ? (
            <div style={{
              width: "5rem", height: "5rem", borderRadius: "50%",
              overflow: "hidden", margin: "0 auto 1rem",
              border: "2px solid rgba(232,224,214,0.6)",
            }}>
              <img src={extras.avatarImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ) : (
            <div style={{
              width: "5rem", height: "5rem", borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(232,120,138,0.2), rgba(184,160,210,0.2))",
              border: "2px solid rgba(232,224,214,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2.5rem", margin: "0 auto 1rem",
            }}>
              {extras.avatarEmoji || displayName[0]}
            </div>
          )}

          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.25rem" }}>
            {displayName}
          </h1>
          {realName && (
            <p style={{ fontSize: "0.85rem", color: "rgba(107,100,90,0.5)", marginBottom: "0.25rem" }}>
              {realName}
            </p>
          )}
          {extras.moodEmoji && (
            <span style={{ fontSize: "0.85rem", color: "rgba(107,100,90,0.8)" }}>
              {extras.moodEmoji}
            </span>
          )}
          {extras.bio && (
            <p style={{ color: "rgba(107,100,90,0.7)", fontSize: "0.875rem", marginTop: "0.5rem", maxWidth: "24rem", margin: "0.5rem auto 0" }}>
              {extras.bio}
            </p>
          )}

          {isOwnProfile && (
            <Link href="/profile" style={{
              display: "inline-block", marginTop: "1rem",
              fontSize: "0.8rem", color: "rgba(184,160,210,0.9)", textDecoration: "underline",
            }}>
              Go to your full profile
            </Link>
          )}
        </motion.div>

        {/* Vibes */}
        {(extras.currentSong || extras.comfortMovie || extras.comfortFood) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <GlassCard hover={false} style={{ padding: "1.25rem", marginBottom: "1rem" }}>
              <span style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.6)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Current Vibes
              </span>
              <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {extras.currentSong && (
                  <p style={{ fontSize: "0.85rem", color: "rgba(45,42,38,0.8)" }}>
                    <span style={{ marginRight: "0.5rem" }}>{"\uD83C\uDFB5"}</span>
                    {extras.currentSongArtist && <span style={{ color: "rgba(107,100,90,0.5)" }}>{extras.currentSongArtist} — </span>}
                    <strong>{extras.currentSong}</strong>
                  </p>
                )}
                {extras.comfortMovie && (
                  <p style={{ fontSize: "0.85rem", color: "rgba(45,42,38,0.8)" }}>
                    <span style={{ marginRight: "0.5rem" }}>{"\uD83C\uDFAC"}</span>
                    <strong>{extras.comfortMovie}</strong>
                  </p>
                )}
                {extras.comfortFood && (
                  <p style={{ fontSize: "0.85rem", color: "rgba(45,42,38,0.8)" }}>
                    <span style={{ marginRight: "0.5rem" }}>{"\uD83C\uDF7D\uFE0F"}</span>
                    <strong>{extras.comfortFood}</strong>
                  </p>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Taste DNA summary */}
        {Object.keys(selections).length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <GlassCard hover={false} style={{ padding: "1.25rem" }}>
              <span style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.6)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Taste DNA
              </span>
              <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {Object.entries(selections).map(([step, picks]) => {
                  const idx = parseInt(step);
                  if (!picks || picks.length === 0) return null;
                  return (
                    <div key={step}>
                      <p style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.5)", marginBottom: "0.25rem" }}>
                        {CATEGORY_ICONS[idx] || ""} {CATEGORY_LABELS[idx] || `Category ${idx + 1}`}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                        {picks.map((pick) => (
                          <span key={pick} style={{
                            padding: "0.2rem 0.5rem", borderRadius: "9999px",
                            background: "rgba(184,160,210,0.08)", border: "1px solid rgba(184,160,210,0.15)",
                            fontSize: "0.72rem", color: "rgba(45,42,38,0.7)",
                          }}>
                            {pick}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </main>
  );
}
