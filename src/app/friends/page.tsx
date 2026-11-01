"use client";

import { IconTarget, IconWave, IconChat } from "@/components/icons/SweetSpotIcons";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { ShareProfileModal } from "@/components/ui/ShareProfileModal";
import { useAuth } from "@/hooks/useAuth";
import { useFriendships, type FriendProfile, type Friendship } from "@/hooks/useFriendships";
import Link from "next/link";

// --- Helpers ---

const PALETTE = ["#E8788A", "#B8A0D2", "#8CBFD4", "#E8B88A", "#8AC4A0"];
function avatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function Avatar({ name, avatarUrl, size = 48, userId }: { name: string; avatarUrl?: string | null; size?: number; userId?: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: avatarColor(userId || name),
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontWeight: 700, fontSize: size * 0.4,
    }}>
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// --- Toast ---

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      onAnimationComplete={() => setTimeout(onDone, 2500)}
      style={{
        position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
        padding: "0.65rem 1.25rem", borderRadius: "0.75rem",
        background: "rgba(45,42,38,0.9)", color: "white",
        fontSize: "0.8rem", fontWeight: 500, zIndex: 300,
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
      }}
    >
      {message}
    </motion.div>
  );
}

// --- Friend Card ---

function FriendCard({ friendship, onRemove, onBlock, onMessage, onToast }: {
  friendship: Friendship;
  onRemove: (id: string) => void;
  onBlock: (id: string) => void;
  onMessage: (userId: string) => void;
  onToast: (msg: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const p = friendship.profile;
  if (!p) return null;

  return (
    <GlassCard hover={false} style={{ padding: "1rem", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Avatar name={p.name} avatarUrl={p.avatar_url} size={48} userId={p.id} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(45,42,38,0.9)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.name}
          </div>
          {p.username && (
            <div style={{ fontSize: "0.72rem", color: "rgba(107,100,90,0.5)" }}>@{p.username}</div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => onMessage(p.id)}
            style={{
              padding: "0.35rem 0.65rem", borderRadius: "0.5rem",
              background: "rgba(184,160,210,0.12)", border: "1px solid rgba(184,160,210,0.25)",
              color: "#B8A0D2", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer",
            }}
          >
            Message
          </motion.button>

          <div style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: "0.25rem", color: "rgba(107,100,90,0.4)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
              </svg>
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  style={{
                    position: "absolute", top: "100%", right: 0, zIndex: 50,
                    background: "rgba(255,255,255,0.97)", backdropFilter: "blur(16px)",
                    border: "1px solid rgba(232,224,214,0.6)", borderRadius: "0.6rem",
                    boxShadow: "0 4px 16px rgba(45,42,38,0.1)", overflow: "hidden",
                    minWidth: "8rem",
                  }}
                >
                  <button
                    onClick={() => { onRemove(friendship.id); onToast("Friend removed"); setMenuOpen(false); }}
                    style={{
                      width: "100%", padding: "0.5rem 0.75rem", background: "none", border: "none",
                      fontSize: "0.75rem", color: "rgba(180,60,60,0.8)", cursor: "pointer", textAlign: "left",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(220,80,80,0.06)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                  >
                    Unfriend
                  </button>
                  <button
                    onClick={() => { onBlock(friendship.id); onToast("User blocked"); setMenuOpen(false); }}
                    style={{
                      width: "100%", padding: "0.5rem 0.75rem", background: "none", border: "none",
                      fontSize: "0.75rem", color: "rgba(180,60,60,0.8)", cursor: "pointer", textAlign: "left",
                      borderTop: "1px solid rgba(232,224,214,0.3)",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(220,80,80,0.06)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                  >
                    Block
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// --- Request Card ---

function RequestCard({ friendship, type, onAccept, onDecline, onToast }: {
  friendship: Friendship;
  type: "received" | "sent";
  onAccept?: (id: string, requesterId: string) => void;
  onDecline?: (id: string) => void;
  onToast: (msg: string) => void;
}) {
  const p = friendship.profile;
  if (!p) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{
        display: "flex", alignItems: "center", gap: "0.75rem",
        padding: "0.75rem 1rem",
        background: "rgba(255,255,255,0.6)",
        borderRadius: "0.75rem",
        border: "1px solid rgba(232,224,214,0.5)",
      }}
    >
      <Avatar name={p.name} avatarUrl={p.avatar_url} size={44} userId={p.id} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "rgba(45,42,38,0.9)" }}>{p.name}</div>
        {p.username && <div style={{ fontSize: "0.68rem", color: "rgba(107,100,90,0.5)" }}>@{p.username}</div>}
        <div style={{ fontSize: "0.6rem", color: "rgba(107,100,90,0.35)", marginTop: "0.1rem" }}>
          {timeAgo(friendship.created_at)}
        </div>
      </div>

      {type === "received" ? (
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { onAccept?.(friendship.id, friendship.requester_id); onToast("Friend request accepted!"); }}
            style={{
              padding: "0.35rem 0.7rem", borderRadius: "0.5rem", border: "none",
              background: "rgba(138,196,160,0.2)", color: "rgba(60,120,70,0.9)",
              fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
            }}
          >
            Accept
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { onDecline?.(friendship.id); onToast("Request declined"); }}
            style={{
              padding: "0.35rem 0.7rem", borderRadius: "0.5rem", border: "none",
              background: "rgba(220,80,80,0.08)", color: "rgba(180,60,60,0.7)",
              fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
            }}
          >
            Decline
          </motion.button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{
            padding: "0.25rem 0.6rem", borderRadius: "1rem",
            background: "rgba(232,224,214,0.4)", fontSize: "0.68rem",
            color: "rgba(107,100,90,0.5)", fontWeight: 500,
          }}>
            Pending
          </span>
          <button
            onClick={() => { onDecline?.(friendship.id); onToast("Request cancelled"); }}
            style={{
              background: "none", border: "none", fontSize: "0.68rem",
              color: "rgba(180,60,60,0.6)", cursor: "pointer", textDecoration: "underline",
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </motion.div>
  );
}

// --- Find Friends Tab ---

function FindFriendsTab({ onToast }: { onToast: (msg: string) => void }) {
  const { sendRequest, getFriendshipStatus, searchUsers } = useFriendships();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(FriendProfile & { friendStatus?: string })[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingTo, setSendingTo] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const found = await searchUsers(q);
      // Check friendship status for each result
      const enriched = await Promise.all(
        found.map(async (p) => {
          const { status } = await getFriendshipStatus(p.id);
          return { ...p, friendStatus: status || undefined };
        })
      );
      setResults(enriched);
      setSearching(false);
    }, 300);
  }, [searchUsers, getFriendshipStatus]);

  const handleSendRequest = async (userId: string) => {
    setSendingTo((prev) => new Set(prev).add(userId));
    const { error } = await sendRequest(userId);
    if (error) {
      onToast(error);
    } else {
      onToast("Friend request sent!");
      setResults((prev) => prev.map((p) => p.id === userId ? { ...p, friendStatus: "pending" } : p));
    }
    setSendingTo((prev) => { const n = new Set(prev); n.delete(userId); return n; });
  };

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name or username..."
          autoFocus
          style={{
            width: "100%", padding: "0.7rem 1rem", borderRadius: "0.75rem",
            border: "1px solid rgba(232,224,214,0.6)", background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(12px)", fontSize: "0.85rem",
            color: "rgba(45,42,38,0.9)", outline: "none", boxSizing: "border-box",
          }}
        />
      </div>

      {searching && (
        <div style={{ textAlign: "center", padding: "1.5rem", fontSize: "0.8rem", color: "rgba(107,100,90,0.4)" }}>
          Searching...
        </div>
      )}

      {!searching && query.length >= 2 && results.length === 0 && (
        <div style={{ textAlign: "center", padding: "2rem", fontSize: "0.8rem", color: "rgba(107,100,90,0.4)" }}>
          No users found for &ldquo;{query}&rdquo;
        </div>
      )}

      {!searching && query.length < 2 && (
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <p style={{ marginBottom: "0.5rem" }}><IconTarget size={24} /></p>
          <p style={{ fontSize: "0.82rem", color: "rgba(107,100,90,0.5)" }}>Search by name or username to find friends</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {results.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.65rem 0.85rem", borderRadius: "0.75rem",
              background: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(232,224,214,0.4)",
            }}
          >
            <Avatar name={p.name} avatarUrl={p.avatar_url} size={40} userId={p.id} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "rgba(45,42,38,0.9)" }}>{p.name}</div>
              {p.username && <div style={{ fontSize: "0.68rem", color: "rgba(107,100,90,0.5)" }}>@{p.username}</div>}
            </div>

            {p.friendStatus === "accepted" ? (
              <span style={{
                padding: "0.25rem 0.6rem", borderRadius: "1rem",
                background: "rgba(138,196,160,0.15)", fontSize: "0.68rem",
                color: "rgba(60,120,70,0.8)", fontWeight: 600,
                display: "flex", alignItems: "center", gap: "0.25rem",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                Friends
              </span>
            ) : p.friendStatus === "pending" ? (
              <span style={{
                padding: "0.25rem 0.6rem", borderRadius: "1rem",
                background: "rgba(232,224,214,0.4)", fontSize: "0.68rem",
                color: "rgba(107,100,90,0.5)", fontWeight: 500,
              }}>
                Requested
              </span>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSendRequest(p.id)}
                disabled={sendingTo.has(p.id)}
                style={{
                  padding: "0.35rem 0.75rem", borderRadius: "0.5rem", border: "none",
                  background: "linear-gradient(135deg, #E8788A, #B8A0D2)",
                  color: "white", fontSize: "0.72rem", fontWeight: 600,
                  cursor: "pointer", opacity: sendingTo.has(p.id) ? 0.6 : 1,
                }}
              >
                {sendingTo.has(p.id) ? "..." : "Add Friend"}
              </motion.button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// --- Main Page ---

export default function FriendsPage() {
  const { user, loading: authLoading } = useAuth();
  const { friends, pendingReceived, pendingSent, loading, acceptRequest, declineRequest, removeFriend, blockUser } = useFriendships();
  const [tab, setTab] = useState<"all" | "requests" | "find">("all");
  const [toast, setToast] = useState("");
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const showToast = (msg: string) => setToast(msg);

  if (authLoading) return null;

  if (!user) {
    return (
      <>
        <AnimatedBackground />
        <Navbar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", paddingTop: "7rem" }}>
          <div style={{
            padding: "3rem 2rem", textAlign: "center",
            background: "rgba(255,255,255,0.8)", backdropFilter: "blur(20px)",
            borderRadius: "1.25rem", border: "1px solid rgba(232,224,214,0.6)",
          }}>
            <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "rgba(45,42,38,0.85)" }}>Sign in to manage friends</p>
            <p style={{ fontSize: "0.8rem", color: "rgba(107,100,90,0.5)", marginTop: "0.5rem", marginBottom: "1rem" }}>
              Connect with friends to plan events together.
            </p>
            <Link href="/auth?next=/friends" style={{
              padding: "0.6rem 1.5rem", borderRadius: "0.75rem",
              background: "linear-gradient(135deg, #E8788A, #B8A0D2)",
              color: "white", fontSize: "0.85rem", fontWeight: 600,
              textDecoration: "none", display: "inline-block",
            }}>
              Sign In
            </Link>
          </div>
        </div>
      </>
    );
  }

  const totalRequests = pendingReceived.length + pendingSent.length;

  return (
    <>
      <AnimatedBackground />
      <Navbar />

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "7.5rem 1rem 2rem" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "rgba(45,42,38,0.9)", margin: 0 }}>Friends</h1>
            {friends.length > 0 && (
              <span style={{
                padding: "0.15rem 0.5rem", borderRadius: "1rem",
                background: "rgba(184,160,210,0.15)", fontSize: "0.72rem",
                color: "#B8A0D2", fontWeight: 700,
              }}>
                {friends.length}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setShareModalOpen(true)}
              style={{
                padding: "0.5rem 1rem", borderRadius: "0.75rem",
                background: "rgba(255,255,255,0.7)", border: "1px solid rgba(232,224,214,0.6)",
                color: "rgba(45,42,38,0.7)", fontSize: "0.8rem",
                fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: "0.35rem",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Share Profile
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setTab("find")}
              style={{
                padding: "0.5rem 1rem", borderRadius: "0.75rem",
                background: "linear-gradient(135deg, #E8788A, #B8A0D2)",
                color: "white", border: "none", fontSize: "0.8rem",
                fontWeight: 600, cursor: "pointer",
              }}
            >
              + Add Friends
            </motion.button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: "0", marginBottom: "1.25rem",
          borderBottom: "1px solid rgba(232,224,214,0.5)",
        }}>
          {([
            { id: "all" as const, label: `All Friends${friends.length > 0 ? ` (${friends.length})` : ""}` },
            { id: "requests" as const, label: `Requests${totalRequests > 0 ? ` (${totalRequests})` : ""}` },
            { id: "find" as const, label: "Find Friends" },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "0.6rem 1rem", background: "none", border: "none",
                borderBottom: tab === t.id ? "2px solid #E8788A" : "2px solid transparent",
                fontSize: "0.82rem", fontWeight: tab === t.id ? 700 : 500,
                color: tab === t.id ? "rgba(45,42,38,0.9)" : "rgba(107,100,90,0.5)",
                cursor: "pointer", transition: "all 0.2s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", fontSize: "0.85rem", color: "rgba(107,100,90,0.4)" }}>
            Loading...
          </div>
        ) : (
          <>
            {/* All Friends Tab */}
            {tab === "all" && (
              friends.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
                  <p style={{ marginBottom: "0.5rem" }}><IconWave size={28} /></p>
                  <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "rgba(45,42,38,0.6)" }}>No friends yet</p>
                  <p style={{ fontSize: "0.78rem", color: "rgba(107,100,90,0.4)", marginTop: "0.3rem", marginBottom: "1rem" }}>
                    Find and add friends to get started!
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setShareModalOpen(true)}
                    style={{
                      padding: "0.6rem 1.25rem", borderRadius: "0.75rem",
                      background: "linear-gradient(135deg, #E8788A, #B8A0D2)",
                      color: "white", border: "none", fontSize: "0.82rem",
                      fontWeight: 600, cursor: "pointer",
                      display: "inline-flex", alignItems: "center", gap: "0.4rem",
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                    Invite Friends
                  </motion.button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "0.6rem" }}>
                  {friends.map((f, i) => (
                    <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <FriendCard
                        friendship={f}
                        onRemove={removeFriend}
                        onBlock={blockUser}
                        onMessage={(uid) => window.location.href = `/messages?dm=${uid}`}
                        onToast={showToast}
                      />
                    </motion.div>
                  ))}
                </div>
              )
            )}

            {/* Requests Tab */}
            {tab === "requests" && (
              <div>
                {/* Received */}
                {pendingReceived.length > 0 && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <h3 style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(45,42,38,0.6)", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Received
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {pendingReceived.map((f, i) => (
                        <motion.div key={f.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                          <RequestCard
                            friendship={f}
                            type="received"
                            onAccept={acceptRequest}
                            onDecline={declineRequest}
                            onToast={showToast}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sent */}
                {pendingSent.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(45,42,38,0.6)", marginBottom: "0.6rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Sent
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      {pendingSent.map((f, i) => (
                        <motion.div key={f.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                          <RequestCard
                            friendship={f}
                            type="sent"
                            onDecline={declineRequest}
                            onToast={showToast}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {totalRequests === 0 && (
                  <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                    <p style={{ marginBottom: "0.5rem" }}><IconChat size={24} /></p>
                    <p style={{ fontSize: "0.85rem", color: "rgba(107,100,90,0.5)" }}>No pending requests</p>
                  </div>
                )}
              </div>
            )}

            {/* Find Friends Tab */}
            {tab === "find" && <FindFriendsTab onToast={showToast} />}
          </>
        )}
      </div>

      {/* Share Profile Modal */}
      {user && (
        <ShareProfileModal
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          profileOwnerId={user.id}
          profileOwnerUsername={user.user_metadata?.username || user.user_metadata?.display_name || ""}
        />
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast("")} />}
      </AnimatePresence>
    </>
  );
}
