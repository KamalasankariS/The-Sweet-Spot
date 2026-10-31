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

export function ShareProfileModal({ open, onClose, profileOwnerId, profileOwnerUsername }: ShareProfileModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const supabase = createClient();

  // Search users by username
  useEffect(() => {
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
  }, [query, supabase, profileOwnerId]);

  const handleShare = async () => {
    if (!supabase || !selectedUser) return;
    setError("");
    setSending(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const requesterUsername = user.user_metadata?.username || user.email?.split("@")[0] || "Someone";
      const recipientUsername = selectedUser.username || `${selectedUser.first_name || ""} ${selectedUser.last_name || ""}`.trim() || "User";

      // Check if profile owner has share consent enabled
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("extras")
        .eq("id", profileOwnerId)
        .single();

      const hasConsent = ownerProfile?.extras?.shareConsent === true;

      if (hasConsent) {
        // Auto-approve: create share record directly
        await supabase.from("profile_shares").insert({
          profile_owner_id: profileOwnerId,
          shared_by: user.id,
          shared_with: selectedUser.id,
        });

        // Notify profile owner
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

        // Notify recipient
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
        // Need approval: create share request
        const { data: request, error: reqError } = await supabase
          .from("profile_share_requests")
          .insert({
            profile_owner_id: profileOwnerId,
            requester_id: user.id,
            recipient_id: selectedUser.id,
          })
          .select("id")
          .single();

        if (reqError) throw reqError;

        // Notify profile owner for approval
        await supabase.from("notifications").insert({
          user_id: profileOwnerId,
          type: "share_request",
          title: "Profile share request",
          body: `@${requesterUsername} wants to share your profile with @${recipientUsername}`,
          data: {
            request_id: request.id,
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

  const reset = () => {
    setQuery("");
    setResults([]);
    setSelectedUser(null);
    setSending(false);
    setSent(false);
    setError("");
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
                /* Success state */
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
                    {/* Check if auto-approved or pending */}
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
                  <p style={{ fontSize: "0.78rem", color: "rgba(107,100,90,0.5)", marginBottom: "0.75rem" }}>
                    Share <strong>@{profileOwnerUsername}</strong>&apos;s profile with another user
                  </p>

                  {/* Search input */}
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
                    {/* Search icon */}
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(107,100,90,0.4)"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)" }}
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                  </div>

                  {/* Search results */}
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

                  {/* Error */}
                  {error && (
                    <p style={{
                      fontSize: "0.75rem", color: "rgba(180,60,60,0.9)",
                      background: "rgba(220,80,80,0.06)", padding: "0.5rem 0.75rem",
                      borderRadius: "0.5rem", marginBottom: "0.75rem",
                    }}>
                      {error}
                    </p>
                  )}

                  {/* Share button */}
                  <button
                    onClick={handleShare}
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
