"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

interface ShareProfileModalProps {
  open: boolean;
  onClose: () => void;
  profileOwnerId: string;
  profileOwnerUsername: string;
}

interface UserResult {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
}

const SHARE_CHANNELS = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    color: "#25D366",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    getUrl: (profileUrl: string, text: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${text} ${profileUrl}`)}`,
  },
  {
    id: "gmail",
    label: "Email",
    color: "#EA4335",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"/>
      </svg>
    ),
    getUrl: (profileUrl: string, text: string) =>
      `mailto:?subject=${encodeURIComponent("Check out my profile on The Sweet Spot!")}&body=${encodeURIComponent(`${text}\n\n${profileUrl}`)}`,
  },
  {
    id: "messages",
    label: "Messages",
    color: "#34C759",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
    ),
    getUrl: (profileUrl: string, text: string) =>
      `sms:?&body=${encodeURIComponent(`${text} ${profileUrl}`)}`,
  },
  {
    id: "twitter",
    label: "X / Twitter",
    color: "#000000",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    getUrl: (profileUrl: string, text: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`,
  },
];

export function ShareProfileModal({ open, onClose, profileOwnerId, profileOwnerUsername }: ShareProfileModalProps) {
  const [tab, setTab] = useState<"external" | "inapp">("external");
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const supabase = createClient();

  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/profile/${profileOwnerId}`
    : "";
  const shareText = `Join me on The Sweet Spot and let's plan our next outing together!`;

  // Search users by username (for in-app sharing)
  useEffect(() => {
    if (tab !== "inapp") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 2 || !supabase) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, username, first_name, last_name")
        .or(`username.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .neq("id", profileOwnerId)
        .limit(8);
      setResults((data as UserResult[]) || []);
      setSearching(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, supabase, profileOwnerId, tab]);

  const handleInAppShare = async () => {
    if (!supabase || !selectedUser) return;
    setError("");
    setSending(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const requesterUsername = user.user_metadata?.username || user.email?.split("@")[0] || "Someone";
      const recipientUsername = selectedUser.username || `${selectedUser.first_name || ""} ${selectedUser.last_name || ""}`.trim() || "User";

      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("extras")
        .eq("id", profileOwnerId)
        .single();

      const hasConsent = ownerProfile?.extras?.shareConsent === true;

      if (hasConsent) {
        await supabase.from("profile_shares").insert({
          profile_owner_id: profileOwnerId,
          shared_by: user.id,
          shared_with: selectedUser.id,
        });

        await supabase.from("notifications").insert({
          user_id: profileOwnerId,
          type: "profile_shared",
          title: "Your profile was shared",
          body: `@${requesterUsername} shared your profile with @${recipientUsername}`,
          data: {
            requester_id: user.id,
            requester_username: requesterUsername,
            recipient_id: selectedUser.id,
            recipient_username: recipientUsername,
            profile_owner_id: profileOwnerId,
            owner_username: profileOwnerUsername,
          },
        });

        await supabase.from("notifications").insert({
          user_id: selectedUser.id,
          type: "profile_received",
          title: "A profile was shared with you",
          body: `@${requesterUsername} shared @${profileOwnerUsername}'s profile with you`,
          data: {
            sharer_id: user.id,
            sharer_username: requesterUsername,
            profile_owner_id: profileOwnerId,
            profile_owner_username: profileOwnerUsername,
          },
        });
      } else {
        const { error: reqError } = await supabase
          .from("profile_share_requests")
          .insert({
            profile_owner_id: profileOwnerId,
            requester_id: user.id,
            recipient_id: selectedUser.id,
          })
          .select("id")
          .single();

        if (reqError) throw reqError;

        await supabase.from("notifications").insert({
          user_id: profileOwnerId,
          type: "share_request",
          title: "Profile share request",
          body: `@${requesterUsername} wants to share your profile with @${recipientUsername}`,
          data: {
            requester_id: user.id,
            requester_username: requesterUsername,
            recipient_id: selectedUser.id,
            recipient_username: recipientUsername,
            profile_owner_id: profileOwnerId,
            owner_username: profileOwnerUsername,
          },
        });
      }

      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to share");
    } finally {
      setSending(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: `${profileOwnerUsername} on The Sweet Spot`,
        text: shareText,
        url: profileUrl,
      });
    } catch { /* user cancelled */ }
  };

  const reset = () => {
    setTab("external");
    setQuery("");
    setResults([]);
    setSelectedUser(null);
    setSending(false);
    setSent(false);
    setError("");
    setCopied(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => { onClose(); reset(); }}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(45,42,38,0.4)",
            backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: "24rem",
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(20px)",
              borderRadius: "1.25rem",
              border: "1px solid rgba(232,224,214,0.6)",
              boxShadow: "0 20px 60px rgba(45,42,38,0.15)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "1.25rem 1.25rem 0.75rem",
              borderBottom: "1px solid rgba(232,224,214,0.4)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 600, color: "rgba(45,42,38,0.9)", margin: 0 }}>
                Share Profile
              </h2>
              <button
                onClick={() => { onClose(); reset(); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(107,100,90,0.4)", fontSize: "1.2rem" }}
              >
                x
              </button>
            </div>

            <div style={{ padding: "1.25rem" }}>
              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ textAlign: "center", padding: "1rem 0" }}
                >
                  <div style={{
                    width: "3.5rem", height: "3.5rem", borderRadius: "50%",
                    background: "rgba(138,196,160,0.15)", border: "2px solid rgba(138,196,160,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 1rem", fontSize: "1.5rem",
                  }}>
                    <span>&#x2705;</span>
                  </div>
                  <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "rgba(45,42,38,0.85)", marginBottom: "0.3rem" }}>
                    {selectedUser?.username ? `Shared with @${selectedUser.username}` : "Share request sent"}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "rgba(107,100,90,0.5)" }}>
                    They&apos;ll receive a notification
                  </p>
                  <button
                    onClick={() => { onClose(); reset(); }}
                    style={{
                      marginTop: "1rem", padding: "0.6rem 1.5rem", borderRadius: "0.6rem",
                      border: "none", background: "linear-gradient(135deg, #E8788A, #B8A0D2, #8CBFD4)",
                      color: "white", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Done
                  </button>
                </motion.div>
              ) : (
                <>
                  {/* Tabs */}
                  <div style={{
                    display: "flex", gap: "0", marginBottom: "1rem",
                    borderBottom: "1px solid rgba(232,224,214,0.4)",
                  }}>
                    {([
                      { id: "external" as const, label: "Share via" },
                      { id: "inapp" as const, label: "Send in app" },
                    ]).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        style={{
                          flex: 1, padding: "0.5rem", background: "none", border: "none",
                          borderBottom: tab === t.id ? "2px solid #E8788A" : "2px solid transparent",
                          fontSize: "0.78rem", fontWeight: tab === t.id ? 700 : 500,
                          color: tab === t.id ? "rgba(45,42,38,0.9)" : "rgba(107,100,90,0.5)",
                          cursor: "pointer", transition: "all 0.2s",
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {tab === "external" ? (
                    <>
                      {/* Share channel buttons */}
                      <div style={{
                        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                        gap: "0.75rem", marginBottom: "1rem",
                      }}>
                        {SHARE_CHANNELS.map((ch) => (
                          <a
                            key={ch.id}
                            href={ch.getUrl(profileUrl, shareText)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "flex", flexDirection: "column", alignItems: "center",
                              gap: "0.4rem", textDecoration: "none",
                            }}
                          >
                            <div style={{
                              width: "3rem", height: "3rem", borderRadius: "50%",
                              background: ch.color,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              cursor: "pointer", transition: "transform 0.15s",
                            }}
                              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                            >
                              {ch.icon}
                            </div>
                            <span style={{ fontSize: "0.65rem", color: "rgba(45,42,38,0.6)", textAlign: "center" }}>
                              {ch.label}
                            </span>
                          </a>
                        ))}
                      </div>

                      {/* Copy link */}
                      <div style={{
                        display: "flex", gap: "0.5rem", alignItems: "center",
                        padding: "0.6rem 0.75rem", borderRadius: "0.6rem",
                        background: "rgba(232,224,214,0.2)", marginBottom: "0.75rem",
                      }}>
                        <input
                          readOnly
                          value={profileUrl}
                          style={{
                            flex: 1, background: "none", border: "none", outline: "none",
                            fontSize: "0.72rem", color: "rgba(45,42,38,0.6)",
                            overflow: "hidden", textOverflow: "ellipsis",
                          }}
                        />
                        <button
                          onClick={handleCopyLink}
                          style={{
                            padding: "0.35rem 0.75rem", borderRadius: "0.5rem",
                            border: "none", background: copied ? "rgba(138,196,160,0.2)" : "rgba(45,42,38,0.08)",
                            color: copied ? "rgba(60,120,70,0.9)" : "rgba(45,42,38,0.7)",
                            fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
                            transition: "all 0.2s", whiteSpace: "nowrap",
                          }}
                        >
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>

                      {/* Native share (useful on mobile) */}
                      {typeof navigator !== "undefined" && "share" in navigator && (
                        <button
                          onClick={handleNativeShare}
                          style={{
                            width: "100%", padding: "0.65rem",
                            borderRadius: "0.6rem", border: "1px solid rgba(232,224,214,0.5)",
                            background: "rgba(255,255,255,0.6)",
                            color: "rgba(45,42,38,0.7)", fontSize: "0.8rem",
                            fontWeight: 500, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                            <polyline points="16 6 12 2 8 6"/>
                            <line x1="12" y1="2" x2="12" y2="15"/>
                          </svg>
                          More sharing options...
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {/* In-app share */}
                      <p style={{ fontSize: "0.78rem", color: "rgba(107,100,90,0.5)", marginBottom: "0.75rem" }}>
                        Share <strong>@{profileOwnerUsername}</strong>&apos;s profile with another user
                      </p>

                      <div style={{ position: "relative", marginBottom: "0.75rem" }}>
                        <input
                          type="text"
                          value={selectedUser ? `@${selectedUser.username || selectedUser.first_name}` : query}
                          onChange={(e) => { setSelectedUser(null); setQuery(e.target.value); }}
                          placeholder="Search by username or name..."
                          style={{
                            width: "100%", padding: "0.7rem 1rem 0.7rem 2.25rem",
                            borderRadius: "0.6rem", border: "1px solid rgba(232,224,214,0.6)",
                            background: selectedUser ? "rgba(184,160,210,0.06)" : "rgba(255,255,255,0.6)",
                            fontSize: "0.85rem", color: "rgba(45,42,38,0.9)", outline: "none",
                            boxSizing: "border-box",
                          }}
                        />
                        <svg
                          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(107,100,90,0.4)"
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }}
                        >
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.3-4.3" />
                        </svg>
                      </div>

                      {!selectedUser && (results.length > 0 || searching) && (
                        <div style={{
                          maxHeight: "12rem", overflowY: "auto",
                          border: "1px solid rgba(232,224,214,0.4)",
                          borderRadius: "0.6rem", marginBottom: "0.75rem",
                        }}>
                          {searching && (
                            <div style={{ padding: "0.75rem", textAlign: "center", fontSize: "0.75rem", color: "rgba(107,100,90,0.4)" }}>
                              Searching...
                            </div>
                          )}
                          {results.map((u) => (
                            <button
                              key={u.id}
                              onClick={() => { setSelectedUser(u); setQuery(""); setResults([]); }}
                              style={{
                                width: "100%", display: "flex", alignItems: "center", gap: "0.6rem",
                                padding: "0.6rem 0.75rem", background: "none", border: "none",
                                borderBottom: "1px solid rgba(232,224,214,0.2)",
                                cursor: "pointer", textAlign: "left", transition: "background 0.15s",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(184,160,210,0.06)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              <div style={{
                                width: "2rem", height: "2rem", borderRadius: "50%",
                                background: "linear-gradient(135deg, rgba(232,120,138,0.2), rgba(184,160,210,0.2))",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "0.8rem", flexShrink: 0,
                              }}>
                                {(u.username || u.first_name || "?")[0].toUpperCase()}
                              </div>
                              <div>
                                <p style={{ fontSize: "0.8rem", fontWeight: 500, color: "rgba(45,42,38,0.85)", margin: 0 }}>
                                  {u.username ? `@${u.username}` : "User"}
                                </p>
                                {u.first_name && (
                                  <p style={{ fontSize: "0.68rem", color: "rgba(107,100,90,0.5)", margin: 0 }}>
                                    {u.first_name} {u.last_name || ""}
                                  </p>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {error && (
                        <p style={{
                          fontSize: "0.75rem", color: "rgba(180,60,60,0.9)",
                          background: "rgba(220,80,80,0.06)", padding: "0.5rem 0.75rem",
                          borderRadius: "0.5rem", marginBottom: "0.75rem",
                        }}>
                          {error}
                        </p>
                      )}

                      <button
                        onClick={handleInAppShare}
                        disabled={!selectedUser || sending}
                        style={{
                          width: "100%", padding: "0.75rem",
                          borderRadius: "0.6rem", border: "none",
                          background: selectedUser
                            ? "linear-gradient(135deg, #E8788A, #B8A0D2, #8CBFD4)"
                            : "rgba(232,224,214,0.4)",
                          color: selectedUser ? "white" : "rgba(107,100,90,0.4)",
                          fontSize: "0.85rem", fontWeight: 600,
                          cursor: selectedUser ? "pointer" : "not-allowed",
                          opacity: sending ? 0.6 : 1,
                          transition: "all 0.2s",
                        }}
                      >
                        {sending ? "Sharing..." : selectedUser ? `Share with @${selectedUser.username || selectedUser.first_name}` : "Select a user to share with"}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
