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

export function Navbar() {
  const { user, loading, signOut, configured } = useAuth();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0.75rem 1.5rem" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: "1rem",
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(232,224,214,0.6)",
          padding: "0.5rem 1rem",
          boxShadow: "0 2px 12px rgba(45,42,38,0.04)",
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

          {/* Nav links */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: "1.1rem", whiteSpace: "nowrap", flexShrink: 0 }}>
            <NavLink href="/quiz">Quiz</NavLink>
            <NavLink href="/plan">Plan</NavLink>
            <NavLink href="/group">Groups</NavLink>
            <NavLink href="/friends">Friends</NavLink>
            <NavLink href="/contacts">Contacts</NavLink>
            <NavLink href="/wrapped">Wrapped</NavLink>
          </div>

          {/* CTA / Auth */}
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
          </div>
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
