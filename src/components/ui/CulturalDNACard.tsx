"use client";

import { motion } from "framer-motion";

interface CategoryInsight {
  label: string;
  color: string;
}

interface CulturalDNACardProps {
  name: string;
  archetype: string;
  archetypeEmoji?: string;
  archetypeTagline: string;
  archetypeDescription: string;
  aesthetic: string;
  topTraits: { trait: string; value: number }[];
  categoryInsights: {
    music: CategoryInsight;
    film: CategoryInsight;
    dining: CategoryInsight;
    nightlife: CategoryInsight;
    style: CategoryInsight;
  };
}

export function CulturalDNACard({
  name,
  archetype,
  archetypeEmoji,
  archetypeTagline,
  archetypeDescription,
  aesthetic,
  topTraits,
  categoryInsights,
}: CulturalDNACardProps) {
  const maxTrait = Math.max(...topTraits.map((t) => t.value), 1);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        width: "100%",
        maxWidth: "400px",
        borderRadius: "1.5rem",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Card background with gradient border */}
      <div
        style={{
          padding: "2px",
          borderRadius: "1.5rem",
          background: "linear-gradient(135deg, #E8788A, #B8A0D2, #8CBFD4, #8AC4A0)",
        }}
      >
        <div
          style={{
            background: "linear-gradient(160deg, #FFFFFF 0%, #FAF5F0 100%)",
            borderRadius: "calc(1.5rem - 2px)",
            padding: "2rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background glows */}
          <div
            style={{
              position: "absolute",
              top: "-2rem",
              right: "-2rem",
              width: "10rem",
              height: "10rem",
              background: "radial-gradient(circle, rgba(184,160,210,0.15) 0%, transparent 70%)",
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-2rem",
              left: "-2rem",
              width: "8rem",
              height: "8rem",
              background: "radial-gradient(circle, rgba(140,191,212,0.12) 0%, transparent 70%)",
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />

          {/* Header */}
          <div style={{ position: "relative", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "0.6rem", color: "rgba(45,42,38,0.35)", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                Cultural DNA
              </span>
              <span className="gradient-text" style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.1em" }}>
                THE SWEET SPOT
              </span>
            </div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.15rem" }}>{name}</h3>
          </div>

          {/* Archetype */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{
              marginBottom: "1.5rem",
              padding: "1rem 1.25rem",
              borderRadius: "1rem",
              background: "linear-gradient(135deg, rgba(232,120,138,0.08) 0%, rgba(140,191,212,0.08) 100%)",
              border: "1px solid rgba(232,224,214,0.4)",
            }}
          >
            <div style={{ fontSize: "0.6rem", color: "rgba(45,42,38,0.35)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "0.35rem" }}>
              Your Archetype
            </div>
            <div className="gradient-text" style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.2rem" }}>
              {archetypeEmoji && <span style={{ marginRight: "0.4rem" }}>{archetypeEmoji}</span>}
              {archetype}
            </div>
            <div style={{ fontSize: "0.8rem", color: "rgba(45,42,38,0.5)", fontStyle: "italic" }}>
              {archetypeTagline}
            </div>
          </motion.div>

          {/* Taste Dimensions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", position: "relative", marginBottom: "1.25rem" }}>
            <TasteRow emoji="music" label="Music" value={categoryInsights.music.label} color={categoryInsights.music.color} delay={0.35} />
            <TasteRow emoji="theater" label="Film" value={categoryInsights.film.label} color={categoryInsights.film.color} delay={0.4} />
            <TasteRow emoji="restaurant" label="Dining" value={categoryInsights.dining.label} color={categoryInsights.dining.color} delay={0.45} />
            <TasteRow emoji="crystal" label="Nightlife" value={categoryInsights.nightlife.label} color={categoryInsights.nightlife.color} delay={0.5} />
            <TasteRow emoji="sparkle" label="Style" value={categoryInsights.style.label} color={categoryInsights.style.color} delay={0.55} />
          </div>

          {/* Personality Traits */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ marginBottom: "1.25rem" }}
          >
            <div style={{ fontSize: "0.6rem", color: "rgba(45,42,38,0.25)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "0.6rem" }}>
              Top Traits
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {topTraits.map((t, i) => (
                <div key={t.trait} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ fontSize: "0.75rem", color: "rgba(45,42,38,0.5)", width: "5.5rem", flexShrink: 0 }}>
                    {t.trait}
                  </span>
                  <div style={{ flex: 1, height: "4px", borderRadius: "2px", background: "rgba(45,42,38,0.06)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(10, (t.value / maxTrait) * 100)}%` }}
                      transition={{ delay: 0.7 + i * 0.1, duration: 0.6, ease: "easeOut" }}
                      style={{
                        height: "100%",
                        borderRadius: "2px",
                        background: `linear-gradient(90deg, ${["#E8788A", "#B8A0D2", "#8CBFD4"][i] || "#8AC4A0"}, ${["#B8A0D2", "#8CBFD4", "#8AC4A0"][i] || "#E8B88A"})`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Archetype description */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              background: "rgba(45,42,38,0.02)",
              border: "1px solid rgba(232,224,214,0.4)",
              marginBottom: "1.25rem",
            }}
          >
            <p style={{ fontSize: "0.78rem", color: "rgba(45,42,38,0.5)", lineHeight: 1.5, fontStyle: "italic" }}>
              &ldquo;{archetypeDescription}&rdquo;
            </p>
          </motion.div>

          {/* Overall Aesthetic */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            style={{
              paddingTop: "1rem",
              borderTop: "1px solid rgba(232,224,214,0.5)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "0.6rem", color: "rgba(45,42,38,0.25)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "0.4rem" }}>
              Your Vibe in One Line
            </div>
            <div
              className="gradient-text"
              style={{ fontSize: "0.95rem", fontWeight: 600, fontStyle: "italic" }}
            >
              &ldquo;{aesthetic}&rdquo;
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function TasteRow({
  emoji,
  label,
  value,
  color,
  delay = 0,
}: {
  emoji: string;
  label: string;
  value: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -15 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
    >
      <span style={{ fontSize: "1.1rem", width: "1.5rem", textAlign: "center" }}>{emoji}</span>
      <div>
        <div style={{ fontSize: "0.6rem", color: "rgba(45,42,38,0.35)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {label}
        </div>
        <div style={{ fontSize: "0.85rem", fontWeight: 500, color }}>
          {value}
        </div>
      </div>
    </motion.div>
  );
}
