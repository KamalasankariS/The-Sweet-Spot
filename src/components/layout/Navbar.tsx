"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function Navbar() {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}
    >
      <div style={{ maxWidth: "1024px", margin: "0 auto", padding: "1rem 2rem" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: "1rem",
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.06)",
          padding: "0.75rem 1.5rem",
        }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
            <div style={{ position: "relative", width: "2.25rem", height: "2.25rem" }}>
              <div style={{ position: "absolute", top: "0.25rem", left: 0, width: "1.5rem", height: "1.5rem", borderRadius: "50%", border: "2px solid rgba(249,115,22,0.7)" }} />
              <div style={{ position: "absolute", top: "0.25rem", left: "0.75rem", width: "1.5rem", height: "1.5rem", borderRadius: "50%", border: "2px solid rgba(236,72,153,0.7)" }} />
            </div>
            <span className="gradient-text" style={{ fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
              The Sweet Spot
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: "2rem" }}>
            <NavLink href="/quiz">Take the Quiz</NavLink>
            <NavLink href="/group">My Groups</NavLink>
          </div>

          {/* CTA */}
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/quiz"
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "0.75rem",
                background: "linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)",
                color: "white",
                fontSize: "0.875rem",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", textDecoration: "none", transition: "color 0.3s" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,1)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
    >
      {children}
    </Link>
  );
}
