"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Navbar } from "@/components/layout/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useRouter } from "next/navigation";
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

type RelationshipStatus =
  | "none"
  | "friends"
  | "request_sent"
  | "request_received"
  | "self"
  | "logged_out";

export default function PublicProfilePage() {
  return (
    <Suspense>
      <PublicProfileInner />
    </Suspense>
  );
}

function PublicProfileInner() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [relationship, setRelationship] = useState<RelationshipStatus>("none");
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [mutualCount, setMutualCount] = useState(0);
  const supabase = useRef(createClient()).current;

  // Load profile
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

  // Determine relationship status
  useEffect(() => {
    if (authLoading) return;
    if (!user) { setRelationship("logged_out"); return; }
    if (user.id === profileId) { setRelationship("self"); return; }
    if (!supabase) return;

    async function checkRelationship() {
      const { data } = await supabase!
        .from("friendships")
        .select("id, status, requester_id")
        .or(
          `and(requester_id.eq.${user!.id},addressee_id.eq.${profileId}),and(requester_id.eq.${profileId},addressee_id.eq.${user!.id})`
        )
        .limit(1);

      if (!data || data.length === 0) {
        setRelationship("none");
        return;
      }

      const f = data[0];
      setFriendshipId(f.id);

      if (f.status === "accepted") {
        setRelationship("friends");
      } else if (f.status === "pending") {
        setRelationship(f.requester_id === user!.id ? "request_sent" : "request_received");
      } else if (f.status === "blocked") {
        setNotFound(true); // hide profile from blocked users
      }
    }

    checkRelationship();
  }, [supabase, user, authLoading, profileId]);

  // Count mutual friends
  useEffect(() => {
    if (!supabase || !user || user.id === profileId) return;

    async function countMutuals() {
      // Get my friends
      const { data: myFriends } = await supabase!
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`);

      // Get their friends
      const { data: theirFriends } = await supabase!
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${profileId},addressee_id.eq.${profileId}`);

      if (!myFriends || !theirFriends) return;

      const myFriendIds = new Set(
        myFriends.map((f) => f.requester_id === user!.id ? f.addressee_id : f.requester_id)
      );
      const theirFriendIds = new Set(
        theirFriends.map((f) => f.requester_id === profileId ? f.addressee_id : f.requester_id)
      );

      let count = 0;
      myFriendIds.forEach((id) => { if (theirFriendIds.has(id)) count++; });
      setMutualCount(count);
    }

    countMutuals();
  }, [supabase, user, profileId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  // Actions
  const sendFriendRequest = useCallback(async () => {
    if (!supabase || !user) return;
    setActionLoading(true);

    const { error } = await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: profileId,
      status: "pending",
    });

    if (!error) {
      setRelationship("request_sent");
      showToast("Friend request sent!");

      // Send notification
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("name, username")
        .eq("id", user.id)
        .single();

      await supabase.from("notifications").insert({
        user_id: profileId,
        type: "friend_request",
        title: "New friend request",
        body: `${myProfile?.name || "Someone"} sent you a friend request`,
        data: { requester_id: user.id, requester_username: myProfile?.username || "" },
      });
    } else {
      showToast(error.message);
    }
    setActionLoading(false);
  }, [supabase, user, profileId]);

  const cancelRequest = useCallback(async () => {
    if (!supabase || !friendshipId) return;
    setActionLoading(true);
    await supabase.from("friendships").delete().eq("id", friendshipId);
    setRelationship("none");
    setFriendshipId(null);
    showToast("Request cancelled");
    setActionLoading(false);
  }, [supabase, friendshipId]);

  const acceptRequest = useCallback(async () => {
    if (!supabase || !friendshipId || !user) return;
    setActionLoading(true);
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
    setRelationship("friends");
    showToast("You're now friends!");

    // Notify the requester
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("name, username")
      .eq("id", user.id)
      .single();

    await supabase.from("notifications").insert({
      user_id: profileId,
      type: "friend_accepted",
      title: "Friend request accepted!",
      body: `${myProfile?.name || "Someone"} accepted your friend request`,
      data: { accepter_id: user.id },
    });

    setActionLoading(false);
  }, [supabase, friendshipId, user, profileId]);

  const declineRequest = useCallback(async () => {
    if (!supabase || !friendshipId) return;
    setActionLoading(true);
    await supabase.from("friendships").delete().eq("id", friendshipId);
    setRelationship("none");
    setFriendshipId(null);
    showToast("Request declined");
    setActionLoading(false);
  }, [supabase, friendshipId]);

  const removeFriend = useCallback(async () => {
    if (!supabase || !friendshipId) return;
    setActionLoading(true);
    await supabase.from("friendships").delete().eq("id", friendshipId);
    setRelationship("none");
    setFriendshipId(null);
    showToast("Friend removed");
    setActionLoading(false);
  }, [supabase, friendshipId]);

  // --- Renders ---

  if (loading || authLoading) {
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
          style={{ textAlign: "center", marginBottom: "1.5rem" }}
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

          {/* Mutual friends indicator */}
          {relationship !== "self" && relationship !== "logged_out" && mutualCount > 0 && (
            <p style={{ fontSize: "0.75rem", color: "rgba(107,100,90,0.45)", marginTop: "0.4rem" }}>
              {mutualCount} mutual friend{mutualCount !== 1 ? "s" : ""}
            </p>
          )}
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" }}
        >
          {/* Self */}
          {relationship === "self" && (
            <Link href="/profile" style={{
              padding: "0.55rem 1.5rem", borderRadius: "0.75rem",
              background: "rgba(255,255,255,0.7)", border: "1px solid rgba(232,224,214,0.6)",
              color: "rgba(45,42,38,0.8)", fontSize: "0.82rem", fontWeight: 600,
              textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.35rem",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit Profile
            </Link>
          )}

          {/* Not logged in */}
          {relationship === "logged_out" && (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => router.push(`/auth?next=/profile/${profileId}`)}
              style={{
                padding: "0.6rem 1.75rem", borderRadius: "0.75rem",
                background: "linear-gradient(135deg, #E8788A, #B8A0D2)",
                color: "white", border: "none", fontSize: "0.85rem",
                fontWeight: 600, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
              Sign up to connect
            </motion.button>
          )}

          {/* No relationship — Add Friend */}
          {relationship === "none" && (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={sendFriendRequest}
              disabled={actionLoading}
              style={{
                padding: "0.6rem 1.75rem", borderRadius: "0.75rem",
                background: "linear-gradient(135deg, #E8788A, #B8A0D2)",
                color: "white", border: "none", fontSize: "0.85rem",
                fontWeight: 600, cursor: "pointer",
                opacity: actionLoading ? 0.6 : 1,
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
              {actionLoading ? "Sending..." : "Add Friend"}
            </motion.button>
          )}

          {/* Request sent — Requested (tap to cancel) */}
          {relationship === "request_sent" && (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={cancelRequest}
              disabled={actionLoading}
              style={{
                padding: "0.6rem 1.75rem", borderRadius: "0.75rem",
                background: "rgba(255,255,255,0.7)", border: "1px solid rgba(232,224,214,0.6)",
                color: "rgba(45,42,38,0.6)", fontSize: "0.85rem",
                fontWeight: 600, cursor: "pointer",
                opacity: actionLoading ? 0.6 : 1,
              }}
            >
              {actionLoading ? "..." : "Requested"}
            </motion.button>
          )}

          {/* Request received — Accept / Decline */}
          {relationship === "request_received" && (
            <>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={acceptRequest}
                disabled={actionLoading}
                style={{
                  padding: "0.6rem 1.5rem", borderRadius: "0.75rem",
                  background: "linear-gradient(135deg, #E8788A, #B8A0D2)",
                  color: "white", border: "none", fontSize: "0.85rem",
                  fontWeight: 600, cursor: "pointer",
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                {actionLoading ? "..." : "Accept"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={declineRequest}
                disabled={actionLoading}
                style={{
                  padding: "0.6rem 1.5rem", borderRadius: "0.75rem",
                  background: "rgba(255,255,255,0.7)", border: "1px solid rgba(232,224,214,0.6)",
                  color: "rgba(45,42,38,0.6)", fontSize: "0.85rem",
                  fontWeight: 600, cursor: "pointer",
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                Decline
              </motion.button>
            </>
          )}

          {/* Already friends — Friends badge + Message */}
          {relationship === "friends" && (
            <>
              <div style={{
                position: "relative",
                display: "inline-flex",
              }}>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={removeFriend}
                  title="Unfriend"
                  style={{
                    padding: "0.6rem 1.5rem", borderRadius: "0.75rem",
                    background: "rgba(138,196,160,0.12)", border: "1px solid rgba(138,196,160,0.3)",
                    color: "rgba(60,120,70,0.9)", fontSize: "0.85rem",
                    fontWeight: 600, cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: "0.35rem",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>
                  Friends
                </motion.button>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => router.push(`/messages?dm=${profileId}`)}
                style={{
                  padding: "0.6rem 1.5rem", borderRadius: "0.75rem",
                  background: "linear-gradient(135deg, #E8788A, #B8A0D2)",
                  color: "white", border: "none", fontSize: "0.85rem",
                  fontWeight: 600, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: "0.35rem",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                Message
              </motion.button>
            </>
          )}

          {/* Share button — always visible for logged in users */}
          {relationship !== "logged_out" && (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={async () => {
                const url = window.location.href;
                const shareData = {
                  title: `${displayName} on The Sweet Spot`,
                  text: `Check out ${displayName}'s taste profile on The Sweet Spot!`,
                  url,
                };
                try {
                  if (navigator.share) {
                    await navigator.share(shareData);
                  } else {
                    await navigator.clipboard.writeText(url);
                    showToast("Profile link copied!");
                  }
                } catch { /* cancelled */ }
              }}
              style={{
                padding: "0.6rem", borderRadius: "0.75rem",
                background: "rgba(255,255,255,0.7)", border: "1px solid rgba(232,224,214,0.6)",
                color: "rgba(45,42,38,0.5)", cursor: "pointer",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}
              title="Share profile"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </motion.button>
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

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            style={{
              position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
              padding: "0.65rem 1.25rem", borderRadius: "0.75rem",
              background: "rgba(45,42,38,0.9)", color: "white",
              fontSize: "0.8rem", fontWeight: 500, zIndex: 300,
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
