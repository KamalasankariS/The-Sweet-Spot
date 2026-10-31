"use client";

import { IconLock } from "@/components/icons/SweetSpotIcons";

import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface AuthGateProps {
  children: React.ReactNode;
  message?: string;
  description?: string;
}

export function AuthGate({ children, message, description }: AuthGateProps) {
  const { user, loading, configured } = useAuth();

  if (loading) return null;

  if (!configured || !user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: "60vh", padding: "2rem",
        }}
      >
        <div style={{
          padding: "2.5rem 2rem", textAlign: "center", maxWidth: "24rem",
          background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)",
          borderRadius: "1.25rem", border: "1px solid rgba(232,224,214,0.6)",
          boxShadow: "0 4px 24px rgba(45,42,38,0.06)",
        }}>
          <div style={{ marginBottom: "0.75rem" }}><IconLock size={32} /></div>
          <p style={{ fontSize: "1.05rem", fontWeight: 700, color: "rgba(45,42,38,0.85)", margin: "0 0 0.5rem" }}>
            {message || "Sign in required"}
          </p>
          <p style={{ fontSize: "0.8rem", color: "rgba(107,100,90,0.5)", margin: "0 0 1.25rem", lineHeight: 1.5 }}>
            {description || "Sign in with Google or email to save your itineraries, get personalized recommendations, and connect with friends."}
          </p>
          <Link
            href="/auth"
            style={{
              display: "inline-block",
              padding: "0.65rem 1.5rem", borderRadius: "0.75rem",
              background: "linear-gradient(135deg, #E8788A, #B8A0D2)",
              color: "white", fontSize: "0.85rem", fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Sign In
          </Link>
          <p style={{ fontSize: "0.68rem", color: "rgba(107,100,90,0.35)", marginTop: "0.75rem" }}>
            Your data won&apos;t persist without an account
          </p>
        </div>
      </motion.div>
    );
  }

  return <>{children}</>;
}
