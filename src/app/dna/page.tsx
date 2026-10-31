"use client";

import { IconTarget } from "@/components/icons/SweetSpotIcons";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Navbar } from "@/components/layout/Navbar";
import { CulturalDNACard } from "@/components/ui/CulturalDNACard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Toast } from "@/components/ui/Toast";
import { shareDNACard } from "@/lib/share";
import { analyzeTaste, type TasteAnalysis } from "@/lib/tasteEngine";
import type { LocalProfile } from "@/hooks/useLocalProfile";

interface DNAResult {
  archetype: TasteAnalysis["archetype"];
  scores: TasteAnalysis["scores"];
  topTraits: TasteAnalysis["topTraits"];
  aesthetic: string;
  categoryInsights: TasteAnalysis["categoryInsights"];
  source: "llm" | "fallback";
}

export default function DNAPage() {
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [result, setResult] = useState<DNAResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [variationCount, setVariationCount] = useState(0);
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("sweetspot_profile");
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  const generateDNA = useCallback(
    async (selections: Record<number, string[]>, variation?: number) => {
      setLoading(true);
      try {
        const res = await fetch("/api/dna/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selections, variation }),
        });
        const data = await res.json();
        setResult(data);
      } catch {
        // Fallback to local analysis
        const analysis = analyzeTaste(selections);
        setResult({ ...analysis, source: "fallback" });
      } finally {
        setLoading(false);
        setRegenerating(false);
      }
    },
    []
  );

  useEffect(() => {
    if (profile) {
      generateDNA(profile.selections);
    }
  }, [profile, generateDNA]);

  const handleRegenerate = () => {
    if (profile && !regenerating) {
      setRegenerating(true);
      const nextVariation = variationCount + 1;
      setVariationCount(nextVariation);
      generateDNA(profile.selections, nextVariation);
    }
  };

  if (!profile) {
    return (
      <>
        <AnimatedBackground />
        <Navbar />
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6rem 2rem 2rem",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: "1rem" }}><IconTarget size={40} /></div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.75rem" }}>
              No Taste Profile Yet
            </h2>
            <p style={{ color: "rgba(107,100,90,0.8)", marginBottom: "1.5rem" }}>
              Take the quiz to generate your Cultural DNA card.
            </p>
            <a href="/quiz">
              <GradientButton>Take the Quiz</GradientButton>
            </a>
          </div>
        </div>
      </>
    );
  }

  if (loading && !result) {
    return (
      <>
        <AnimatedBackground />
        <Navbar />
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.5rem",
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ fontSize: "3rem" }}
          >
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ color: "rgba(45,42,38,0.5)", fontSize: "0.95rem" }}
          >
            Analyzing your cultural DNA...
          </motion.p>
        </div>
      </>
    );
  }

  if (!result) return null;

  return (
    <>
      <AnimatedBackground />
      <Navbar />

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "7rem 2rem 3rem",
          gap: "2rem",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: "0.5rem" }}
        >
          <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Your <span className="gradient-text">Cultural DNA</span>
          </h1>
          <p style={{ color: "rgba(107,100,90,0.8)", fontSize: "0.95rem" }}>
            Your taste tells a story — here&apos;s yours
          </p>
        </motion.div>

        <CulturalDNACard
          name={profile.name}
          archetype={result.archetype.name}
          archetypeEmoji={result.archetype.emoji}
          archetypeTagline={result.archetype.tagline}
          archetypeDescription={result.archetype.description}
          aesthetic={result.aesthetic}
          topTraits={result.topTraits}
          categoryInsights={result.categoryInsights}
        />

        {regenerating && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ color: "rgba(45,42,38,0.35)", fontSize: "0.8rem" }}
          >
            Regenerating...
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}
        >
          <GradientButton
            onClick={async () => {
              const res = await shareDNACard(profile.name, window.location.href);
              if (res === "copied") showToast("Link copied to clipboard!");
            }}
          >
            Share Card
          </GradientButton>
          <GradientButton
            variant="outline"
            onClick={handleRegenerate}
            disabled={regenerating}
          >
            Regenerate
          </GradientButton>
          <GradientButton variant="outline" onClick={() => (window.location.href = "/quiz")}>
            Retake Quiz
          </GradientButton>
          <GradientButton variant="ghost" onClick={() => (window.location.href = "/group")}>
            Create a Group
          </GradientButton>
        </motion.div>

        {result.source === "llm" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            style={{ color: "rgba(45,42,38,0.15)", fontSize: "0.7rem" }}
          >
            Powered by AI — same taste, fresh perspective each time
          </motion.p>
        )}
      </div>
      <Toast message={toast} visible={!!toast} />
    </>
  );
}
