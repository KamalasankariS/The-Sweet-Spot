"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useItineraryHistory } from "@/hooks/useItineraryHistory";
import { AuthGate } from "@/components/ui/AuthGate";
import { Navbar } from "@/components/layout/Navbar";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { IconBack, IconSparkle, Icon } from "@/components/icons/SweetSpotIcons";
import Link from "next/link";

const PERSONALITIES: Record<string, { title: string; icon: string; desc: string }> = {
  foodie: { title: "The Foodie Explorer", icon: "restaurant", desc: "You can't resist a great restaurant or cafe. Your taste buds lead the way!" },
  nightowl: { title: "The Night Owl", icon: "moon", desc: "Bars, clubs, late-night eats -- you come alive when the sun goes down." },
  culture: { title: "The Culture Vulture", icon: "theater", desc: "Museums, galleries, shows -- you soak up art and culture everywhere you go." },
  adventurer: { title: "The Urban Adventurer", icon: "map", desc: "Parks, landmarks, hidden gems -- you love discovering what makes a city tick." },
  social: { title: "The Social Butterfly", icon: "friends", desc: "It's not about where you go, it's who you're with. Every outing is a party." },
  balanced: { title: "The Sweet Spot Seeker", icon: "sparkle", desc: "A perfect mix of everything -- food, fun, culture, and vibes. True balance." },
};

function getPersonality(cats: { category: string; count: number }[]): { title: string; icon: string; desc: string } {
  if (cats.length === 0) return PERSONALITIES.balanced;
  const top = cats[0].category.toLowerCase();
  if (top.includes("restaurant") || top.includes("food") || top.includes("cafe") || top.includes("bakery") || top.includes("pizza"))
    return PERSONALITIES.foodie;
  if (top.includes("bar") || top.includes("club") || top.includes("nightlife") || top.includes("lounge"))
    return PERSONALITIES.nightowl;
  if (top.includes("museum") || top.includes("gallery") || top.includes("theater") || top.includes("theatre") || top.includes("art"))
    return PERSONALITIES.culture;
  if (top.includes("park") || top.includes("landmark") || top.includes("outdoor") || top.includes("trail"))
    return PERSONALITIES.adventurer;
  return PERSONALITIES.balanced;
}

export default function WrappedPage() {
  return (
    <AuthGate message="Your Wrapped awaits!" description="Sign in to see your personalized outing summary.">
      <WrappedContent />
    </AuthGate>
  );
}

function WrappedContent() {
  const { history, loading, getFrequentCategories } = useItineraryHistory();
  const [slide, setSlide] = useState(0);
  const totalSlides = 4;

  const cats = getFrequentCategories();
  const totalOutings = history.length;
  const totalStops = history.reduce((sum, h) => sum + (Array.isArray(h.itinerary) ? h.itinerary.length : 0), 0);
  const confirmedStops = history.reduce(
    (sum, h) => sum + h.stops_feedback.filter((s) => s.confirmed).length, 0
  );
  const changedStops = history.reduce(
    (sum, h) => sum + h.stops_feedback.filter((s) => !s.confirmed).length, 0
  );
  const personality = getPersonality(cats);
  const topCats = cats.slice(0, 5);
  const maxCatCount = topCats[0]?.count || 1;
  const locations = new Set(history.map((h) => h.location).filter(Boolean));

  const next = () => setSlide((s) => Math.min(s + 1, totalSlides - 1));
  const prev = () => setSlide((s) => Math.max(s - 1, 0));

  const handleShare = async () => {
    const text = `My Sweet Spot Wrapped:\n${personality.title}\n${totalOutings} outings, ${totalStops} stops planned\nTop vibe: ${topCats[0]?.category || "Explorer"}\n\nFind your sweet spot too!`;
    if (navigator.share) {
      try { await navigator.share({ title: "My Sweet Spot Wrapped", text }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(text); } catch {}
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          style={{ width: 32, height: 32, border: "3px solid rgba(184,160,210,0.3)", borderTopColor: "#B8A0D2", borderRadius: "50%" }}
        />
      </div>
    );
  }

  if (totalOutings === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", padding: "2rem" }}>
        <div style={{ textAlign: "center", maxWidth: "20rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}><IconSparkle size={48} /></div>
          <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "rgba(45,42,38,0.85)", marginBottom: "0.5rem" }}>
            No outings yet!
          </p>
          <p style={{ fontSize: "0.8rem", color: "rgba(107,100,90,0.5)", marginBottom: "1.5rem", lineHeight: 1.5 }}>
            Plan your first outing to unlock your personalized Wrapped summary.
          </p>
          <Link href="/plan" style={{
            display: "inline-block", padding: "0.65rem 1.5rem", borderRadius: "0.75rem",
            background: "linear-gradient(135deg, #E8788A, #B8A0D2)", color: "white",
            fontSize: "0.85rem", fontWeight: 600, textDecoration: "none",
          }}>
            Plan an Outing
          </Link>
        </div>
      </div>
    );
  }

  const slides = [
    // Slide 0: Intro
    <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: "2rem" }}>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
        style={{ marginBottom: "1.5rem" }}><IconSparkle size={56} /></motion.div>
      <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
        style={{ fontSize: "1.8rem", fontWeight: 800, background: "linear-gradient(135deg, #E8788A, #B8A0D2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.5rem" }}>
        Your Sweet Spot Wrapped
      </motion.h1>
      <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
        style={{ fontSize: "0.9rem", color: "rgba(107,100,90,0.6)", maxWidth: "20rem" }}>
        Here&apos;s a look at your outings and adventures
      </motion.p>
    </motion.div>,

    // Slide 1: Stats
    <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "2rem" }}>
      <motion.p initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{ fontSize: "0.75rem", fontWeight: 600, color: "#B8A0D2", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.5rem" }}>
        By the numbers
      </motion.p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", maxWidth: "20rem", width: "100%" }}>
        {[
          { val: totalOutings, label: "Outings", color: "#E8788A" },
          { val: totalStops, label: "Stops Planned", color: "#B8A0D2" },
          { val: confirmedStops, label: "On Track", color: "#8AC4A0" },
          { val: locations.size, label: "Cities", color: "#8CBFD4" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.15, type: "spring" }}
            style={{
              padding: "1.25rem", borderRadius: "1rem", textAlign: "center",
              background: "rgba(255,255,255,0.8)", border: "1px solid rgba(232,224,214,0.5)",
              boxShadow: "0 4px 16px rgba(45,42,38,0.06)",
            }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.5)", marginTop: "0.2rem" }}>{s.label}</div>
          </motion.div>
        ))}
      </div>
      {changedStops > 0 && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          style={{ fontSize: "0.72rem", color: "rgba(107,100,90,0.4)", marginTop: "1rem" }}>
          You switched things up {changedStops} time{changedStops !== 1 ? "s" : ""} &mdash; spontaneity is your thing!
        </motion.p>
      )}
    </motion.div>,

    // Slide 2: Top categories
    <motion.div key="cats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "2rem" }}>
      <motion.p initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{ fontSize: "0.75rem", fontWeight: 600, color: "#E8788A", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1.5rem" }}>
        Your Top Vibes
      </motion.p>
      <div style={{ width: "100%", maxWidth: "20rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {topCats.map((c, i) => (
          <motion.div key={c.category} initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.12 }}
            style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "rgba(45,42,38,0.7)", width: "5.5rem", textAlign: "right", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.category}
            </span>
            <div style={{ flex: 1, height: "1.4rem", borderRadius: "0.5rem", background: "rgba(232,224,214,0.3)", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(c.count / maxCatCount) * 100}%` }}
                transition={{ delay: 0.4 + i * 0.12, duration: 0.6, ease: "easeOut" }}
                style={{
                  height: "100%", borderRadius: "0.5rem",
                  background: i === 0 ? "linear-gradient(135deg, #E8788A, #B8A0D2)" : `rgba(184,160,210,${0.6 - i * 0.1})`,
                }}
              />
            </div>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(45,42,38,0.6)", width: "1.5rem" }}>{c.count}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>,

    // Slide 3: Personality + share
    <motion.div key="personality" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: "2rem" }}>
      <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", delay: 0.2 }}
        style={{ marginBottom: "1rem" }}><Icon name={personality.icon} size={56} /></motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        style={{ fontSize: "0.72rem", fontWeight: 600, color: "#B8A0D2", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.3rem" }}>
        You are...
      </motion.p>
      <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}
        style={{ fontSize: "1.5rem", fontWeight: 800, color: "rgba(45,42,38,0.9)", marginBottom: "0.5rem" }}>
        {personality.title}
      </motion.h2>
      <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9 }}
        style={{ fontSize: "0.82rem", color: "rgba(107,100,90,0.6)", maxWidth: "18rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
        {personality.desc}
      </motion.p>
      <motion.button initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.1 }}
        onClick={handleShare}
        style={{
          padding: "0.7rem 1.8rem", borderRadius: "0.75rem", border: "none",
          background: "linear-gradient(135deg, #E8788A, #B8A0D2)", color: "white",
          fontSize: "0.85rem", fontWeight: 700, cursor: "pointer",
          boxShadow: "0 4px 16px rgba(232,120,138,0.3)",
        }}>
        Share Your Wrapped
      </motion.button>
    </motion.div>,
  ];

  return (
    <>
    <AnimatedBackground />
    <Navbar />
    <div style={{ minHeight: "100vh", position: "relative", paddingTop: "5rem" }}>
      {/* Back button */}
      <div style={{ position: "fixed", top: "5.5rem", left: "1.5rem", zIndex: 10 }}>
        <Link href="/" className="back-link">
          <IconBack size={14} /> Home
        </Link>
      </div>

      {/* Progress dots */}
      <div style={{ position: "fixed", top: "5.5rem", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "0.4rem", zIndex: 10 }}>
        {Array.from({ length: totalSlides }).map((_, i) => (
          <div key={i} onClick={() => setSlide(i)} style={{
            width: slide === i ? 20 : 8, height: 8, borderRadius: 4,
            background: slide === i ? "linear-gradient(135deg, #E8788A, #B8A0D2)" : "rgba(232,224,214,0.5)",
            transition: "all 0.3s", cursor: "pointer",
          }} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {slides[slide]}
      </AnimatePresence>

      {/* Navigation */}
      <div style={{
        position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
        display: "flex", gap: "1rem", alignItems: "center",
      }}>
        {slide > 0 && (
          <button onClick={prev} style={{
            padding: "0.5rem 1.2rem", borderRadius: "0.6rem",
            border: "1px solid rgba(232,224,214,0.5)", background: "rgba(255,255,255,0.8)",
            fontSize: "0.78rem", color: "rgba(107,100,90,0.6)", cursor: "pointer",
          }}>
            Back
          </button>
        )}
        {slide < totalSlides - 1 && (
          <button onClick={next} style={{
            padding: "0.5rem 1.2rem", borderRadius: "0.6rem", border: "none",
            background: "linear-gradient(135deg, #E8788A, #B8A0D2)", color: "white",
            fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
          }}>
            Next
          </button>
        )}
      </div>

    </div>
    </>
  );
}
