"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Navbar } from "@/components/layout/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { ChemistryRing } from "@/components/ui/ChemistryRing";

const DEMO_ITINERARY = {
  groupName: "Friday Night Crew",
  groupScore: 87,
  vibeTag: "Wes Anderson meets Tokyo alley",
  location: "Brooklyn, NYC",
  stops: [
    {
      type: "Pre-drinks",
      icon: "🍸",
      time: "7:00 PM",
      name: "Attaboy",
      description: "Intimate speakeasy with bespoke cocktails",
      reason: "Matches Sarah's cocktail obsession + Mike's speakeasy vibe",
      affinity: 91,
      tags: ["Speakeasy", "Cocktails", "Intimate"],
      color: "#f97316",
    },
    {
      type: "Dinner",
      icon: "🍽️",
      time: "8:30 PM",
      name: "Gaijin",
      description: "Modern Japanese izakaya with creative small plates",
      reason:
        "The group's sweet spot: Alex's Japanese obsession meets everyone's izakaya energy",
      affinity: 94,
      tags: ["Japanese", "Izakaya", "Small plates"],
      color: "#ec4899",
    },
    {
      type: "Activity",
      icon: "🎵",
      time: "10:15 PM",
      name: "Nublu",
      description: "Underground live jazz and experimental music venue",
      reason: "Live music venue that bridges Jordan's jazz love with the group's indie taste",
      affinity: 86,
      tags: ["Live music", "Jazz", "Underground"],
      color: "#8b5cf6",
    },
    {
      type: "Nightcap",
      icon: "🌙",
      time: "11:45 PM",
      name: "Maison Premiere",
      description: "Oyster bar with absinthe cocktails and garden seating",
      reason: "Relaxed wind-down spot matching the group's French bistro energy",
      affinity: 88,
      tags: ["Oyster bar", "Garden", "Late-night"],
      color: "#06b6d4",
    },
  ],
  wildcard: {
    type: "Wildcard",
    icon: "🔮",
    name: "Mehanata Bulgarian Bar",
    description: "Wild Bulgarian dance hall with ice room and live bands",
    reason:
      "Nobody's been, but Qloo predicts 89% match based on the group's adventure scores",
    affinity: 89,
    tags: ["Dance", "Adventure", "Unique"],
    color: "#84cc16",
  },
  conversationStarters: [
    "You all love Tarantino, but Sarah's into jazz while Mike's into EDM — ask each other why!",
    "Alex and Jordan both picked Japanese food but for completely different reasons — compare notes.",
    "Everyone vibes with vintage aesthetics — what's the oldest thing you own?",
  ],
};

export default function ItineraryPage() {
  const [loaded, setLoaded] = useState(false);
  const [showWildcard, setShowWildcard] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!loaded) {
    return (
      <>
        <AnimatedBackground />
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center gap-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 rounded-full border-2 border-white/10 border-t-accent-pink"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-white/40 text-sm">
              Finding your sweet spot...
            </p>
          </motion.div>
        </div>
      </>
    );
  }

  const itinerary = DEMO_ITINERARY;

  return (
    <>
      <AnimatedBackground />
      <Navbar />

      <div className="min-h-screen px-6 pt-28 pb-16">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex mb-4"
            >
              <ChemistryRing
                score={itinerary.groupScore}
                size={120}
                label="Group Match"
              />
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Your <span className="gradient-text">Sweet Spot</span> Night
            </h1>
            <p className="text-white/40 mb-1">{itinerary.groupName}</p>
            <p className="text-sm text-white/20">
              📍 {itinerary.location} · Vibe:{" "}
              <span className="gradient-text-cool italic">
                &ldquo;{itinerary.vibeTag}&rdquo;
              </span>
            </p>
          </motion.div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-accent-orange via-accent-pink to-accent-purple opacity-20" />

            <div className="space-y-6">
              {itinerary.stops.map((stop, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.15 }}
                >
                  <GlassCard hover className="p-6 ml-12 relative">
                    {/* Timeline dot */}
                    <div
                      className="absolute -left-[calc(3rem+5px)] top-6 w-3 h-3 rounded-full border-2"
                      style={{
                        borderColor: stop.color,
                        backgroundColor: `${stop.color}30`,
                      }}
                    />

                    {/* Time badge */}
                    <div className="absolute -left-[calc(3rem+65px)] top-5 text-xs text-white/30 font-mono w-14 text-right">
                      {stop.time}
                    </div>

                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                        style={{ backgroundColor: `${stop.color}15` }}
                      >
                        {stop.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <span
                              className="text-xs font-medium uppercase tracking-wider"
                              style={{ color: `${stop.color}99` }}
                            >
                              {stop.type}
                            </span>
                            <h3 className="text-lg font-semibold">
                              {stop.name}
                            </h3>
                          </div>
                          <span
                            className="text-sm font-bold"
                            style={{ color: stop.color }}
                          >
                            {stop.affinity}%
                          </span>
                        </div>

                        <p className="text-sm text-white/40 mb-3">
                          {stop.description}
                        </p>

                        <div className="flex items-start gap-2 mb-3 py-2 px-3 rounded-lg bg-white/[0.02]">
                          <span className="text-xs mt-0.5">💡</span>
                          <span className="text-xs text-white/50 italic">
                            {stop.reason}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {stop.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2.5 py-0.5 rounded-full text-xs"
                              style={{
                                backgroundColor: `${stop.color}10`,
                                color: `${stop.color}90`,
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Wildcard section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-10 ml-12"
          >
            {!showWildcard ? (
              <button
                onClick={() => setShowWildcard(true)}
                className="w-full py-4 rounded-2xl border border-dashed border-accent-lime/20 text-accent-lime/60 text-sm font-medium hover:bg-accent-lime/5 hover:border-accent-lime/30 transition-all cursor-pointer"
              >
                🔮 Reveal the Wildcard Pick
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <GlassCard glow="cyan" className="p-6 border-accent-lime/10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent-lime/10 flex items-center justify-center text-2xl shrink-0">
                      {itinerary.wildcard.icon}
                    </div>
                    <div>
                      <span className="text-xs font-medium text-accent-lime/70 uppercase tracking-wider">
                        Wildcard Pick — The Stretch
                      </span>
                      <h3 className="text-lg font-semibold">
                        {itinerary.wildcard.name}
                      </h3>
                      <p className="text-sm text-white/40 mt-1 mb-3">
                        {itinerary.wildcard.description}
                      </p>
                      <div className="flex items-start gap-2 py-2 px-3 rounded-lg bg-white/[0.02]">
                        <span className="text-xs mt-0.5">🔮</span>
                        <span className="text-xs text-white/50 italic">
                          {itinerary.wildcard.reason}
                        </span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </motion.div>

          {/* Conversation starters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="mt-12"
          >
            <GlassCard hover={false} className="p-6">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <span>💬</span>
                <span className="gradient-text">Conversation Starters</span>
                <span className="text-xs text-white/20 font-normal ml-1">
                  from your taste gaps
                </span>
              </h3>
              <div className="space-y-3">
                {itinerary.conversationStarters.map((starter, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 py-2 px-3 rounded-xl bg-white/[0.02]"
                  >
                    <span className="text-white/20 text-xs mt-0.5 shrink-0">
                      {i + 1}.
                    </span>
                    <span className="text-sm text-white/50">{starter}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <GradientButton>Share Itinerary</GradientButton>
            <GradientButton variant="outline">
              Regenerate Night
            </GradientButton>
          </motion.div>
        </div>
      </div>
    </>
  );
}
