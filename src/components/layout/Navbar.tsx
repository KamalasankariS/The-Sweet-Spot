"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { MessagesBadge } from "@/components/ui/MessagesBadge";
import { createClient } from "@/lib/supabase/client";

function ProfileAvatar({ user }: { user: { id: string; email?: string; user_metadata?: Record<string, string> } }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initials, setInitials] = useState("?");
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!user.id) return;

    // Helper to compute initials from a name string
    const computeInitials = (name: string) => {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        setInitials((parts[0][0] + parts[parts.length - 1][0]).toUpperCase());
      } else if (parts[0]) {
        setInitials(parts[0].slice(0, 2).toUpperCase());
      }
    };

    // Best name source: user_metadata (first+last), then localStorage, then Supabase DB
    const metaFirst = user.user_metadata?.first_name;
    const metaLast = user.user_metadata?.last_name;
    const metaUsername = user.user_metadata?.username;
    const metaDisplay = user.user_metadata?.display_name;

    if (metaFirst && metaLast) {
      computeInitials(`${metaFirst} ${metaLast}`);
    } else if (metaUsername) {
      computeInitials(metaUsername);
    } else if (metaDisplay) {
      computeInitials(metaDisplay);
    }

    // Try localStorage for avatar image and fallback name
    try {
      const saved = localStorage.getItem("sweetspot_profile");
      if (saved) {
        const local = JSON.parse(saved);
        if (local.extras?.avatarImage) setAvatarUrl(local.extras.avatarImage);
        if (!metaFirst && !metaUsername && !metaDisplay && local.name) {
          computeInitials(local.name);
        }
      }
    } catch { /* ignore */ }

    // Supabase: only for avatar image, not name (auth metadata is more reliable)
    if (supabase) {
      supabase
        .from("profiles")
        .select("extras")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.extras?.avatarImage) {
            setAvatarUrl(data.extras.avatarImage as string);
          }
        });
    }
  }, [supabase, user]);

  return (
    <Link href="/profile" title="My Profile">
      <motion.div
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        style={{
          width: "2rem", height: "2rem", borderRadius: "50%",
          overflow: "hidden", cursor: "pointer",
          background: avatarUrl ? "transparent" : "linear-gradient(135deg, #E8788A, #B8A0D2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "2px solid rgba(232,224,214,0.6)",
          flexShrink: 0,
        }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "white", letterSpacing: "0.02em" }}>
            {initials}
          </span>
        )}
      </motion.div>
    </Link>
  );
}

const NAV_LINKS = [
  { href: "/quiz", label: "Quiz" },
  { href: "/plan", label: "Plan" },
  { href: "/group", label: "Groups" },
  { href: "/friends", label: "Friends" },
  { href: "/wrapped", label: "Wrapped" },
];

export function Navbar() {
  const { user, loading, signOut, configured } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0.75rem 1.5rem" }}>
        <div style={{
          borderRadius: "1rem",
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(232,224,214,0.6)",
          boxShadow: "0 2px 12px rgba(45,42,38,0.04)",
          overflow: "hidden",
        }}>
          {/* Main bar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.5rem 1rem",
          }}>
            {/* Logo */}
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
              <img
                src="/backgrounds/The Sweet Spot Logo.png"
                alt="The Sweet Spot"
                style={{ width: "2.5rem", height: "2.5rem", objectFit: "contain" }}
              />
              <span style={{ fontSize: "1.4rem", fontFamily: "var(--font-yuyu)", color: "#2D2A26", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
                The Sweet Spot
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex" style={{ alignItems: "center", gap: "1.1rem", whiteSpace: "nowrap", flexShrink: 0 }}>
              {NAV_LINKS.map((l) => <NavLink key={l.href} href={l.href}>{l.label}</NavLink>)}
            </div>

            {/* CTA / Auth + hamburger */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0, whiteSpace: "nowrap" }}>
              {configured && !loading && user ? (
                <>
                  <MessagesBadge />
                  <NotificationBell />
                  <ProfileAvatar user={user} />
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={signOut}
                    className="hidden md:inline-flex"
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "0.75rem",
                      border: "1px solid rgba(232,224,214,0.6)",
                      background: "rgba(255,255,255,0.5)",
                      color: "rgba(45,42,38,0.6)",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Sign Out
                  </motion.button>
                </>
              ) : (
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href={configured ? "/auth" : "/quiz"}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "0.75rem",
                      background: "linear-gradient(135deg, #E8788A, #B8A0D2, #8CBFD4)",
                      color: "white",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      textDecoration: "none",
                      display: "inline-block",
                    }}
                  >
                    {!configured ? "Get Started" : loading ? "..." : "Sign In"}
                  </Link>
                </motion.div>
              )}

              {/* Hamburger — mobile only */}
              <button
                className="md:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menu"
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "0.3rem", display: "flex", alignItems: "center", justifyContent: "center",
                  color: "rgba(45,42,38,0.6)",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {mobileOpen ? (
                    <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                  ) : (
                    <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile dropdown */}
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="md:hidden"
              style={{
                borderTop: "1px solid rgba(232,224,214,0.4)",
                padding: "0.5rem 0.75rem 0.75rem",
                display: "flex", flexDirection: "column", gap: "0.15rem",
              }}
            >
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    padding: "0.55rem 0.75rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    color: "rgba(45,42,38,0.7)",
                    textDecoration: "none",
                    display: "block",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(232,224,214,0.25)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  {l.label}
                </Link>
              ))}
              {configured && !loading && user && (
                <button
                  onClick={() => { signOut(); setMobileOpen(false); }}
                  style={{
                    padding: "0.55rem 0.75rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    color: "rgba(220,80,80,0.7)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220,80,80,0.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                >
                  Sign Out
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{ fontSize: "0.8rem", color: "rgba(45,42,38,0.5)", textDecoration: "none", transition: "color 0.3s", whiteSpace: "nowrap" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(45,42,38,1)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(45,42,38,0.5)")}
    >
      {children}
    </Link>
  );
}
