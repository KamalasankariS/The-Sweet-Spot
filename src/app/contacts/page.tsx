"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Navbar } from "@/components/layout/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

interface Contact {
  name: string;
  email: string;
  photo?: string;
}

type Tab = "matched" | "invite";

export default function ContactsPage() {
  const { user, configured } = useAuth();
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);
  const [matched, setMatched] = useState<Contact[]>([]);
  const [notOnApp, setNotOnApp] = useState<Contact[]>([]);
  const [totalContacts, setTotalContacts] = useState(0);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("matched");
  const [invitedEmails, setInvitedEmails] = useState<Set<string>>(new Set());

  const handleSyncContacts = async () => {
    setError("");
    setLoading(true);
    try {
      // First try fetching contacts with existing token
      const res = await fetch("/api/contacts");
      const data = await res.json();

      if (!res.ok && data.error?.includes("No Google token")) {
        // Need to re-auth with contacts scope
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        if (!supabase) throw new Error("Auth not configured");
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=/contacts`,
            scopes: "https://www.googleapis.com/auth/contacts.readonly",
          },
        });
        return; // Will redirect to Google
      }

      if (!res.ok) throw new Error(data.error || "Failed to fetch contacts");
      setMatched(data.matched || []);
      setNotOnApp(data.notOnApp || []);
      setTotalContacts(data.contacts || 0);
      setSynced(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (email: string, name: string) => {
    // For hackathon: copy invite link. In production: send email via Resend
    const inviteUrl = `${window.location.origin}/auth?ref=invite`;
    const message = `Hey ${name}! Join me on The Sweet Spot — an app that finds the perfect plans based on everyone's taste. ${inviteUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Join The Sweet Spot", text: message });
        setInvitedEmails((prev) => new Set(prev).add(email));
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(message);
      setInvitedEmails((prev) => new Set(prev).add(email));
    }
  };

  if (!configured || !user) {
    return (
      <main style={{ minHeight: "100vh", position: "relative" }}>
        <AnimatedBackground />
        <Navbar />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: "1rem", padding: "6rem 1rem" }}>
          <GlassCard>
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>&#x1F465;</p>
              <h1 style={{ fontSize: "1.3rem", fontWeight: 600, color: "rgba(45,42,38,0.9)", marginBottom: "0.5rem" }}>
                Find Your Contacts
              </h1>
              <p style={{ fontSize: "0.85rem", color: "rgba(107,100,90,0.5)", marginBottom: "1.5rem" }}>
                Sign in with Google to find friends already on The Sweet Spot
              </p>
              <Link href="/auth" style={{
                display: "inline-block", padding: "0.7rem 1.5rem", borderRadius: "0.75rem",
                background: "linear-gradient(135deg, #E8788A, #B8A0D2, #8CBFD4)",
                color: "white", fontSize: "0.9rem", fontWeight: 600, textDecoration: "none",
              }}>
                Sign In
              </Link>
            </div>
          </GlassCard>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", position: "relative" }}>
      <AnimatedBackground />
      <Navbar />

      <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "6rem 1rem 3rem" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "rgba(45,42,38,0.9)", marginBottom: "0.4rem" }}>
              Find Your Contacts
            </h1>
            <p style={{ fontSize: "0.85rem", color: "rgba(107,100,90,0.5)" }}>
              See which of your Google contacts are already on The Sweet Spot
            </p>
          </div>

          {!synced ? (
            /* Pre-sync state */
            <GlassCard>
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  style={{ fontSize: "3rem", marginBottom: "1.25rem" }}
                >
                  &#x1F4DA;
                </motion.div>

                <h2 style={{ fontSize: "1.15rem", fontWeight: 600, color: "rgba(45,42,38,0.85)", marginBottom: "0.5rem" }}>
                  Sync your contacts
                </h2>
                <p style={{ fontSize: "0.82rem", color: "rgba(107,100,90,0.5)", marginBottom: "0.35rem", maxWidth: "20rem", margin: "0 auto 1.5rem" }}>
                  We&apos;ll check your Google contacts to find friends on the app.
                  We never store your contact list — matching happens in real-time.
                </p>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      fontSize: "0.8rem", color: "rgba(180,60,60,0.9)",
                      background: "rgba(220,80,80,0.06)", padding: "0.6rem 1rem",
                      borderRadius: "0.5rem", marginBottom: "1rem",
                    }}
                  >
                    {error}
                  </motion.p>
                )}

                <GradientButton onClick={handleSyncContacts} disabled={loading}>
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        style={{ display: "inline-block" }}
                      >
                        &#x1F50D;
                      </motion.span>
                      Searching contacts...
                    </span>
                  ) : (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      Find My Contacts
                    </span>
                  )}
                </GradientButton>

                <p style={{ fontSize: "0.68rem", color: "rgba(107,100,90,0.35)", marginTop: "1rem" }}>
                  &#x1F512; Your contacts are never stored or shared. Read-only access.
                </p>
              </div>
            </GlassCard>
          ) : (
            /* Post-sync state */
            <>
              {/* Stats bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: "1.25rem" }}
              >
                <GlassCard hover={false} style={{ padding: "1rem 1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ fontSize: "0.65rem", color: "rgba(107,100,90,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        Contacts Scanned
                      </span>
                      <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "rgba(45,42,38,0.85)", marginTop: "0.15rem" }}>
                        {totalContacts}
                      </p>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: "0.65rem", color: "rgba(107,100,90,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        On The Sweet Spot
                      </span>
                      <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "rgba(138,196,160,0.9)", marginTop: "0.15rem" }}>
                        {matched.length}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "0.65rem", color: "rgba(107,100,90,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        Invite
                      </span>
                      <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "rgba(184,160,210,0.9)", marginTop: "0.15rem" }}>
                        {notOnApp.length}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                {(["matched", "invite"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    style={{
                      flex: 1, padding: "0.6rem",
                      borderRadius: "0.6rem",
                      border: tab === t ? "1px solid rgba(184,160,210,0.4)" : "1px solid rgba(232,224,214,0.4)",
                      background: tab === t ? "rgba(184,160,210,0.08)" : "rgba(255,255,255,0.5)",
                      color: tab === t ? "rgba(45,42,38,0.85)" : "rgba(107,100,90,0.5)",
                      fontSize: "0.8rem", fontWeight: tab === t ? 600 : 400,
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                  >
                    {t === "matched" ? `On the App (${matched.length})` : `Invite (${notOnApp.length})`}
                  </button>
                ))}
              </div>

              {/* Contact list */}
              <AnimatePresence mode="wait">
                {tab === "matched" ? (
                  <motion.div
                    key="matched"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    {matched.length === 0 ? (
                      <GlassCard hover={false} style={{ padding: "2rem", textAlign: "center" }}>
                        <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>&#x1F914;</p>
                        <p style={{ fontSize: "0.85rem", color: "rgba(107,100,90,0.5)" }}>
                          None of your contacts are on The Sweet Spot yet.
                          <br />Invite them from the Invite tab!
                        </p>
                      </GlassCard>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {matched.map((c) => (
                          <ContactCard key={c.email} contact={c} type="matched" />
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="invite"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    {notOnApp.length === 0 ? (
                      <GlassCard hover={false} style={{ padding: "2rem", textAlign: "center" }}>
                        <p style={{ fontSize: "0.85rem", color: "rgba(107,100,90,0.5)" }}>
                          No contacts to invite — everyone&apos;s already here!
                        </p>
                      </GlassCard>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {notOnApp.map((c) => (
                          <ContactCard
                            key={c.email}
                            contact={c}
                            type="invite"
                            invited={invitedEmails.has(c.email)}
                            onInvite={() => handleInvite(c.email, c.name)}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Re-sync button */}
              <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                <button
                  onClick={() => { setSynced(false); setMatched([]); setNotOnApp([]); }}
                  style={{
                    background: "none", border: "none", fontSize: "0.78rem",
                    color: "rgba(107,100,90,0.4)", cursor: "pointer",
                    textDecoration: "underline", textUnderlineOffset: "2px",
                  }}
                >
                  Re-sync contacts
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </main>
  );
}

function ContactCard({
  contact,
  type,
  invited,
  onInvite,
}: {
  contact: Contact;
  type: "matched" | "invite";
  invited?: boolean;
  onInvite?: () => void;
}) {
  return (
    <GlassCard hover={false} style={{ padding: "0.75rem 1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Avatar */}
        {contact.photo ? (
          <img
            src={contact.photo}
            alt=""
            style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div style={{
            width: "2.5rem", height: "2.5rem", borderRadius: "50%", flexShrink: 0,
            background: type === "matched"
              ? "linear-gradient(135deg, rgba(138,196,160,0.2), rgba(184,160,210,0.2))"
              : "linear-gradient(135deg, rgba(232,120,138,0.15), rgba(184,160,210,0.15))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1rem", fontWeight: 600, color: "rgba(45,42,38,0.5)",
          }}>
            {contact.name[0]?.toUpperCase() || "?"}
          </div>
        )}

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "0.85rem", fontWeight: 500, color: "rgba(45,42,38,0.85)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {contact.name || contact.email}
          </p>
          <p style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.4)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {contact.email}
          </p>
        </div>

        {/* Action */}
        {type === "matched" ? (
          <span style={{
            fontSize: "0.68rem", fontWeight: 500,
            padding: "0.25rem 0.6rem", borderRadius: "9999px",
            background: "rgba(138,196,160,0.12)", color: "rgba(60,120,70,0.8)",
            border: "1px solid rgba(138,196,160,0.2)",
          }}>
            On the app
          </span>
        ) : invited ? (
          <span style={{
            fontSize: "0.68rem", fontWeight: 500,
            padding: "0.25rem 0.6rem", borderRadius: "9999px",
            background: "rgba(184,160,210,0.08)", color: "rgba(107,100,90,0.5)",
            border: "1px solid rgba(184,160,210,0.15)",
          }}>
            Invited
          </span>
        ) : (
          <button
            onClick={onInvite}
            style={{
              fontSize: "0.72rem", fontWeight: 600,
              padding: "0.35rem 0.75rem", borderRadius: "0.5rem",
              border: "none", cursor: "pointer",
              background: "linear-gradient(135deg, #E8788A, #B8A0D2)",
              color: "white", transition: "opacity 0.2s",
            }}
          >
            Invite
          </button>
        )}
      </div>
    </GlassCard>
  );
}
