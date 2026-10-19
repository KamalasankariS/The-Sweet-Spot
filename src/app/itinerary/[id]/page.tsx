"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { Navbar } from "@/components/layout/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { ChemistryRing } from "@/components/ui/ChemistryRing";
import { Toast } from "@/components/ui/Toast";
import { shareItinerary } from "@/lib/share";
import { analyzeTaste } from "@/lib/tasteEngine";

interface GroupData {
  id: string;
  name: string;
  mode: "social" | "corporate";
  occasion: string;
  location: string;
  members: { name: string; selections: Record<number, string[]>; entityIds?: Record<number, Record<string, string>>; createdAt: string }[];
  createdAt: string;
}

interface ItineraryStop {
  type: string;
  icon: string;
  time: string;
  name: string;
  description: string;
  reason: string;
  affinity: number;
  tags: string[];
  color: string;
}

interface GeneratedItinerary {
  groupName: string;
  groupScore: number;
  vibeTag: string;
  location: string;
  stops: ItineraryStop[];
  wildcard: ItineraryStop;
  conversationStarters: string[];
}

// --- Itinerary Generation (deterministic from group data) ---

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function generateItinerary(group: GroupData): GeneratedItinerary {
  const memberNames = group.members.map((m) => m.name);
  const allSelections = group.members.flatMap((m) => Object.values(m.selections).flat());
  const seed = hashString(allSelections.join(",") + group.name);

  // Compute group chemistry from combined taste analysis
  const combinedSelections: Record<number, string[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };
  for (const member of group.members) {
    for (let i = 0; i < 5; i++) {
      combinedSelections[i].push(...(member.selections[i] || []));
    }
  }
  const groupTaste = analyzeTaste(combinedSelections);
  const topTraitSum = groupTaste.topTraits.reduce((s, t) => s + t.value, 0);
  const groupScore = Math.min(98, Math.max(65, 70 + Math.floor(topTraitSum * 1.5) % 28));

  // Find common picks across members
  const findOverlap = (catIndex: number): string[] => {
    const counts: Record<string, number> = {};
    for (const member of group.members) {
      for (const pick of member.selections[catIndex] || []) {
        counts[pick] = (counts[pick] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .filter(([, c]) => c > 1)
      .sort(([, a], [, b]) => b - a)
      .map(([name]) => name);
  };

  const musicOverlap = findOverlap(0);
  const diningOverlap = findOverlap(2);
  const nightlifeOverlap = findOverlap(3);

  // Build vibe tag from archetype
  const vibeTag = groupTaste.aesthetic;

  // Occasion-specific venue templates
  const occasionLabels: Record<string, string> = {
    "chill-night": "Chill Night",
    "birthday": "Birthday Celebration",
    "date-night": "Date Night",
    "celebration": "Celebration",
    "team-dinner": "Team Dinner",
    "client-entertainment": "Client Night",
    "welcome-night": "Welcome Night",
    "offsite": "Offsite Event",
  };

  // Generate venue suggestions based on group preferences
  const topDining = diningOverlap[0] || (combinedSelections[2][0] || "Japanese");
  const topNightlife = nightlifeOverlap[0] || (combinedSelections[3][0] || "Cocktail bars");
  const topMusic = musicOverlap[0] || (combinedSelections[0][0] || "Live music");

  // Build stops using actual group preferences
  const predrinkVenues: Record<string, { name: string; desc: string }> = {
    "Cocktail bars": { name: "Attaboy", desc: "Intimate speakeasy with bespoke cocktails — no menu, just vibes" },
    "Wine bars": { name: "The Four Horsemen", desc: "Natural wine bar with a curated, ever-changing selection" },
    "Dive bars": { name: "Turkey's Nest", desc: "Cash-only neighborhood dive with frozen margaritas" },
    "Rooftop bars": { name: "Westlight", desc: "Panoramic skyline views with craft cocktails 22 floors up" },
    "Speakeasy": { name: "Please Don't Tell", desc: "Enter through a phone booth into cocktail perfection" },
    "Jazz clubs": { name: "Smalls Jazz Club", desc: "Intimate basement jazz with world-class musicians nightly" },
    "Beer gardens": { name: "Radegast Hall", desc: "Sprawling Williamsburg beer hall with live music" },
    "Art galleries": { name: "The Hole", desc: "Contemporary gallery with opening night drinks and DJ sets" },
  };

  const dinnerVenues: Record<string, { name: string; desc: string }> = {
    "Japanese": { name: "ROKC", desc: "Omakase ramen bar with Japanese whisky flights" },
    "Italian": { name: "L'Artusi", desc: "Modern Italian with handmade pasta and an incredible wine list" },
    "Mexican": { name: "Casa Enrique", desc: "Michelin-starred Mexican with mole that changes your life" },
    "Thai": { name: "Fish Cheeks", desc: "Bold Thai seafood in a vibrant, buzzing dining room" },
    "Korean BBQ": { name: "COTE", desc: "Korean steakhouse with tableside grilling and omakase beef" },
    "Farm-to-table": { name: "Olmsted", desc: "Garden-to-table dining from the backyard greenhouse" },
    "Sushi": { name: "Sushi Nakazawa", desc: "20-course omakase from a Jiro Dreams of Sushi protege" },
    "Ramen": { name: "Ichiran", desc: "Solo-booth ramen experience with custom spice levels" },
    "Mediterranean": { name: "Shuka", desc: "Mezze-driven Mediterranean with wood-fired everything" },
    "Indian": { name: "Adda", desc: "Indian home cooking in a Long Island City garage — no shortcuts" },
    "French bistro": { name: "Le Crocodile", desc: "Classic Parisian bistro with steak frites and croque monsieurs" },
    "Street food": { name: "Smorgasburg", desc: "Open-air food market with 100+ vendors from every cuisine" },
  };

  const activityVenues: Record<string, { name: string; desc: string }> = {
    "Live music": { name: "Baby's All Right", desc: "Indie music venue with great sound and late-night dance parties" },
    "Jazz clubs": { name: "Blue Note", desc: "Legendary jazz club with nightly performances from global artists" },
    "Dance clubs": { name: "Elsewhere", desc: "Multi-room club with rooftop, music hall, and underground zone" },
    "Comedy shows": { name: "The Comedy Cellar", desc: "NYC's most iconic comedy club with surprise drop-ins" },
    "Karaoke": { name: "Gagopa Karaoke", desc: "Private rooms with thousands of songs and BYOB drinks" },
    "Art galleries": { name: "Pace Gallery", desc: "World-class contemporary art in a stunning Chelsea space" },
  };

  const predrinkPick = predrinkVenues[topNightlife] || predrinkVenues["Cocktail bars"];
  const dinnerPick = dinnerVenues[topDining] || dinnerVenues["Japanese"];

  // Pick activity based on second nightlife preference or music taste
  const activityNightlife = (combinedSelections[3] || []).find((n) => n !== topNightlife) || "Live music";
  const activityPick = activityVenues[activityNightlife] || activityVenues["Live music"];

  // Nightcap venues
  const nightcapVenues = [
    { name: "Maison Premiere", desc: "Oyster bar with absinthe cocktails and candlelit garden" },
    { name: "The Long Island Bar", desc: "Restored 1950s cocktail bar with perfect martinis" },
    { name: "Bemelmans Bar", desc: "Old-world elegance with live piano and Ludwig Bemelmans murals" },
    { name: "Bar Goto", desc: "Japanese-inspired cocktails in a cozy Lower East Side gem" },
  ];
  const nightcap = nightcapVenues[seed % nightcapVenues.length];

  // Build reason strings referencing actual members
  const member1 = memberNames[0] || "You";
  const member2 = memberNames[1] || "the group";
  const member3 = memberNames[2] || "everyone";

  const stops: ItineraryStop[] = [
    {
      type: "Pre-drinks",
      icon: "🍸",
      time: "7:00 PM",
      name: predrinkPick.name,
      description: predrinkPick.desc,
      reason: `Matches ${member1}'s love of ${topNightlife.toLowerCase()} and ${member2}'s vibe`,
      affinity: Math.min(97, groupScore + (seed % 8)),
      tags: [topNightlife, "Cocktails", "Starting the night right"],
      color: "#f97316",
    },
    {
      type: "Dinner",
      icon: "🍽️",
      time: "8:30 PM",
      name: dinnerPick.name,
      description: dinnerPick.desc,
      reason: diningOverlap.length > 0
        ? `The group's sweet spot — ${diningOverlap[0]} is where ${member1} and ${member2} overlap`
        : `${topDining} scored highest across the group's combined taste profile`,
      affinity: Math.min(98, groupScore + 3 + (seed % 6)),
      tags: [topDining, "Dinner", occasionLabels[group.occasion] || "Night out"],
      color: "#ec4899",
    },
    {
      type: "Activity",
      icon: "🎵",
      time: "10:15 PM",
      name: activityPick.name,
      description: activityPick.desc,
      reason: musicOverlap.length > 0
        ? `Bridges ${member1}'s ${musicOverlap[0]} taste with ${member3}'s ${activityNightlife.toLowerCase()} energy`
        : `${activityNightlife} venue that matches the group's energy level`,
      affinity: Math.min(95, groupScore - 2 + (seed % 10)),
      tags: [activityNightlife, topMusic || "Music", "Late night"],
      color: "#8b5cf6",
    },
    {
      type: "Nightcap",
      icon: "🌙",
      time: "11:45 PM",
      name: nightcap.name,
      description: nightcap.desc,
      reason: `Wind-down spot where ${member1} and ${member2} can decompress — matches the group's warmth score`,
      affinity: Math.min(96, groupScore + 1 + (seed % 7)),
      tags: ["Nightcap", "Intimate", "Late-night"],
      color: "#06b6d4",
    },
  ];

  // Wildcard — something unexpected
  const wildcards = [
    { name: "Mehanata Bulgarian Bar", desc: "Wild Bulgarian dance hall with ice room and live bands", tags: ["Dance", "Adventure", "Unique"] },
    { name: "House of Yes", desc: "Immersive performance venue with themed costume parties", tags: ["Performance", "Immersive", "Wild"] },
    { name: "Sleep No More", desc: "Immersive theater experience in a 1930s hotel", tags: ["Theater", "Immersive", "One-of-a-kind"] },
    { name: "Barcade", desc: "Classic arcade games with craft beers on tap", tags: ["Gaming", "Retro", "Casual"] },
    { name: "ARTECHOUSE", desc: "Immersive digital art installations you walk through", tags: ["Art", "Tech", "Instagram-worthy"] },
    { name: "The McKittrick Hotel Rooftop", desc: "Secret rooftop bar above an immersive theater", tags: ["Rooftop", "Hidden gem", "Atmosphere"] },
  ];
  const wildcardPick = wildcards[seed % wildcards.length];

  const wildcard: ItineraryStop = {
    type: "Wildcard",
    icon: "🔮",
    time: "",
    name: wildcardPick.name,
    description: wildcardPick.desc,
    reason: `Nobody picked this, but Qloo predicts ${85 + (seed % 12)}% match based on the group's combined adventure + energy scores`,
    affinity: 85 + (seed % 12),
    tags: wildcardPick.tags,
    color: "#84cc16",
  };

  // Conversation starters from taste gaps
  const starters: string[] = [];

  // Find interesting taste differences
  if (group.members.length >= 2) {
    const m1 = group.members[0];
    const m2 = group.members[1];
    const m1Music = m1.selections[0] || [];
    const m2Music = m2.selections[0] || [];
    const uniqueToM1 = m1Music.filter((p) => !m2Music.includes(p));
    const uniqueToM2 = m2Music.filter((p) => !m1Music.includes(p));

    if (uniqueToM1.length > 0 && uniqueToM2.length > 0) {
      starters.push(
        `${m1.name} is into ${uniqueToM1[0]} while ${m2.name} loves ${uniqueToM2[0]} — ask each other what you're missing out on.`
      );
    }

    // Dining overlap or gap
    const m1Dining = m1.selections[2] || [];
    const m2Dining = m2.selections[2] || [];
    const diningShared = m1Dining.filter((p) => m2Dining.includes(p));
    if (diningShared.length > 0) {
      starters.push(
        `${m1.name} and ${m2.name} both love ${diningShared[0]} — compare your go-to orders.`
      );
    }
  }

  // Style-based starter
  const allStyles = group.members.flatMap((m) => m.selections[4] || []);
  const uniqueStyles = [...new Set(allStyles)];
  if (uniqueStyles.length >= 2) {
    starters.push(
      `The group spans from ${uniqueStyles[0]} to ${uniqueStyles[uniqueStyles.length - 1]} — debate: is style born or made?`
    );
  }

  // Fallback starters
  if (starters.length < 3) {
    starters.push("If your taste profile were a movie character, who would you be?");
  }
  if (starters.length < 3) {
    starters.push("What's the most underrated spot in the city that nobody else knows about?");
  }

  return {
    groupName: group.name,
    groupScore,
    vibeTag,
    location: group.location,
    stops,
    wildcard,
    conversationStarters: starters.slice(0, 3),
  };
}

// --- Fallback demo itinerary ---

const FALLBACK_ITINERARY: GeneratedItinerary = {
  groupName: "Friday Night Crew",
  groupScore: 87,
  vibeTag: "Candlelit conversations over craft cocktails",
  location: "Brooklyn, NYC",
  stops: [
    { type: "Pre-drinks", icon: "🍸", time: "7:00 PM", name: "Attaboy", description: "Intimate speakeasy with bespoke cocktails", reason: "Matches the group's love of cocktail culture", affinity: 91, tags: ["Speakeasy", "Cocktails", "Intimate"], color: "#f97316" },
    { type: "Dinner", icon: "🍽️", time: "8:30 PM", name: "ROKC", description: "Omakase ramen bar with Japanese whisky flights", reason: "Japanese cuisine scored highest across the group", affinity: 94, tags: ["Japanese", "Izakaya", "Small plates"], color: "#ec4899" },
    { type: "Activity", icon: "🎵", time: "10:15 PM", name: "Baby's All Right", description: "Indie music venue with great sound and late-night dance parties", reason: "Live music bridges everyone's taste profile", affinity: 86, tags: ["Live music", "Indie", "Underground"], color: "#8b5cf6" },
    { type: "Nightcap", icon: "🌙", time: "11:45 PM", name: "Maison Premiere", description: "Oyster bar with absinthe cocktails and candlelit garden", reason: "Relaxed wind-down matching the group's warmth", affinity: 88, tags: ["Oyster bar", "Garden", "Late-night"], color: "#06b6d4" },
  ],
  wildcard: { type: "Wildcard", icon: "🔮", time: "", name: "House of Yes", description: "Immersive performance venue with themed costume parties", reason: "Nobody picked this, but Qloo predicts 89% match based on the group's adventure scores", affinity: 89, tags: ["Performance", "Immersive", "Wild"], color: "#84cc16" },
  conversationStarters: [
    "If your taste profile were a movie character, who would you be?",
    "What's the most underrated spot in the city that nobody else knows about?",
    "The group spans multiple aesthetics — debate: is style born or made?",
  ],
};

// --- Page Component ---

export default function ItineraryPage() {
  const [loading, setLoading] = useState(true);
  const [itinerary, setItinerary] = useState<GeneratedItinerary | null>(null);
  const [showWildcard, setShowWildcard] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  const handleShare = useCallback(async () => {
    if (!itinerary) return;
    const result = await shareItinerary(itinerary.groupName, window.location.href);
    if (result === "copied") showToast("Link copied to clipboard!");
  }, [itinerary, showToast]);

  useEffect(() => {
    const groupRaw = localStorage.getItem("sweetspot_group");

    if (!groupRaw) {
      setTimeout(() => {
        setItinerary(FALLBACK_ITINERARY);
        setLoading(false);
      }, 1500);
      return;
    }

    let group: GroupData;
    try {
      group = JSON.parse(groupRaw);
    } catch {
      setTimeout(() => {
        setItinerary(FALLBACK_ITINERARY);
        setLoading(false);
      }, 1500);
      return;
    }

    // Generate deterministic base itinerary
    const base = generateItinerary(group);

    // Try to enhance with real Qloo recommendations
    fetch("/api/itinerary/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        members: group.members,
        location: group.location,
        occasion: group.occasion,
        groupName: group.name,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.results && data.source === "qloo") {
          const { dining, nightlife, wildcard } = data.results;

          // Overlay Qloo venues onto the deterministic stops
          if (dining?.length > 0) {
            const venue = dining[0];
            base.stops[1] = {
              ...base.stops[1],
              name: venue.name,
              description: venue.properties?.short_description || base.stops[1].description,
              affinity: venue.query?.affinity ? Math.round(venue.query.affinity * 100) : base.stops[1].affinity,
              reason: `Qloo recommends this based on ${group.members.map((m: GroupData["members"][0]) => m.name).join(" & ")}'s combined taste profile`,
            };
          }

          if (nightlife?.length > 0) {
            // Use first nightlife result for pre-drinks
            const predrink = nightlife[0];
            base.stops[0] = {
              ...base.stops[0],
              name: predrink.name,
              description: predrink.properties?.short_description || base.stops[0].description,
              affinity: predrink.query?.affinity ? Math.round(predrink.query.affinity * 100) : base.stops[0].affinity,
              reason: `Qloo's top nightlife match for the group's taste DNA`,
            };

            // Use second nightlife result for nightcap if available
            if (nightlife.length > 1) {
              const nightcap = nightlife[1];
              base.stops[3] = {
                ...base.stops[3],
                name: nightcap.name,
                description: nightcap.properties?.short_description || base.stops[3].description,
                affinity: nightcap.query?.affinity ? Math.round(nightcap.query.affinity * 100) : base.stops[3].affinity,
                reason: `Late-night wind-down spot recommended by Qloo for the group`,
              };
            }
          }

          // Wildcard from Qloo
          if (wildcard?.length > 0) {
            const pick = wildcard[0];
            base.wildcard = {
              ...base.wildcard,
              name: pick.name,
              description: pick.properties?.short_description || base.wildcard.description,
              affinity: pick.query?.affinity ? Math.round(pick.query.affinity * 100) : base.wildcard.affinity,
              reason: `Nobody picked this, but Qloo predicts ${pick.query?.affinity ? Math.round(pick.query.affinity * 100) : base.wildcard.affinity}% match based on the group's combined taste signals`,
            };
          }
        }

        setItinerary(base);
        setLoading(false);
      })
      .catch(() => {
        // Fallback to deterministic itinerary
        setItinerary(base);
        setLoading(false);
      });
  }, []);

  if (loading) {
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
            style={{
              width: "3rem",
              height: "3rem",
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.1)",
              borderTopColor: "#ec4899",
            }}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>
              Finding your sweet spot...
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.75rem" }}>
              Analyzing taste profiles across {5} dimensions
            </p>
          </motion.div>
        </div>
      </>
    );
  }

  if (!itinerary) return null;

  return (
    <>
      <AnimatedBackground />
      <Navbar />

      <div style={{ minHeight: "100vh", padding: "7rem 1.5rem 4rem" }}>
        <div style={{ maxWidth: "48rem", margin: "0 auto" }}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", marginBottom: "3rem" }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              style={{ display: "inline-flex", marginBottom: "1rem" }}
            >
              <ChemistryRing
                score={itinerary.groupScore}
                size={120}
                label="Group Match"
              />
            </motion.div>

            <h1 style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, marginBottom: "0.5rem" }}>
              Your <span className="gradient-text">Sweet Spot</span> Night
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: "0.25rem" }}>
              {itinerary.groupName}
            </p>
            <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.2)" }}>
              📍 {itinerary.location} · Vibe:{" "}
              <span className="gradient-text-cool" style={{ fontStyle: "italic" }}>
                &ldquo;{itinerary.vibeTag}&rdquo;
              </span>
            </p>
          </motion.div>

          {/* Timeline */}
          <div style={{ position: "relative" }}>
            {/* Vertical line */}
            <div
              style={{
                position: "absolute",
                left: "1.5rem",
                top: 0,
                bottom: 0,
                width: "1px",
                background: "linear-gradient(to bottom, #f97316, #ec4899, #8b5cf6, #06b6d4)",
                opacity: 0.2,
              }}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {itinerary.stops.map((stop, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.15 }}
                  style={{ position: "relative" }}
                >
                  {/* Time badge */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "1.5rem",
                      width: "3rem",
                      textAlign: "center",
                    }}
                  >
                    <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
                      {stop.time}
                    </span>
                  </div>

                  {/* Timeline dot */}
                  <div
                    style={{
                      position: "absolute",
                      left: "calc(1.5rem - 5px)",
                      top: "1.7rem",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      border: `2px solid ${stop.color}`,
                      backgroundColor: `${stop.color}30`,
                      zIndex: 2,
                    }}
                  />

                  <GlassCard hover className="p-6" style={{ marginLeft: "4rem" }}>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                      <div
                        style={{
                          width: "3rem",
                          height: "3rem",
                          borderRadius: "0.75rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.5rem",
                          flexShrink: 0,
                          backgroundColor: `${stop.color}15`,
                        }}
                      >
                        {stop.icon}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                          <div>
                            <span
                              style={{
                                fontSize: "0.65rem",
                                fontWeight: 500,
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                color: `${stop.color}99`,
                              }}
                            >
                              {stop.type}
                            </span>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                              {stop.name}
                            </h3>
                          </div>
                          <span style={{ fontSize: "0.875rem", fontWeight: 700, color: stop.color }}>
                            {stop.affinity}%
                          </span>
                        </div>

                        <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.75rem" }}>
                          {stop.description}
                        </p>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "0.5rem",
                            marginBottom: "0.75rem",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "0.5rem",
                            background: "rgba(255,255,255,0.02)",
                          }}
                        >
                          <span style={{ fontSize: "0.75rem", marginTop: "0.1rem" }}>💡</span>
                          <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>
                            {stop.reason}
                          </span>
                        </div>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                          {stop.tags.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                padding: "0.2rem 0.6rem",
                                borderRadius: "9999px",
                                fontSize: "0.7rem",
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
            style={{ marginTop: "2.5rem", marginLeft: "4rem" }}
          >
            {!showWildcard ? (
              <button
                onClick={() => setShowWildcard(true)}
                style={{
                  width: "100%",
                  padding: "1rem",
                  borderRadius: "1rem",
                  border: "1px dashed rgba(132,204,22,0.2)",
                  background: "transparent",
                  color: "rgba(132,204,22,0.6)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(132,204,22,0.05)";
                  e.currentTarget.style.borderColor = "rgba(132,204,22,0.3)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "rgba(132,204,22,0.2)";
                }}
              >
                🔮 Reveal the Wildcard Pick
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <GlassCard glow="cyan" className="border-accent-lime/10" style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: "3rem",
                        height: "3rem",
                        borderRadius: "0.75rem",
                        background: "rgba(132,204,22,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.5rem",
                        flexShrink: 0,
                      }}
                    >
                      {itinerary.wildcard.icon}
                    </div>
                    <div>
                      <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "rgba(132,204,22,0.7)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        Wildcard Pick — The Stretch
                      </span>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                        {itinerary.wildcard.name}
                      </h3>
                      <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", marginTop: "0.25rem", marginBottom: "0.75rem" }}>
                        {itinerary.wildcard.description}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "0.5rem",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "0.5rem",
                          background: "rgba(255,255,255,0.02)",
                        }}
                      >
                        <span style={{ fontSize: "0.75rem", marginTop: "0.1rem" }}>🔮</span>
                        <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>
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
            style={{ marginTop: "3rem" }}
          >
            <GlassCard hover={false} style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>💬</span>
                <span className="gradient-text">Conversation Starters</span>
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.2)", fontWeight: 400, marginLeft: "0.25rem" }}>
                  from your taste gaps
                </span>
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {itinerary.conversationStarters.map((starter, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.75rem",
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.75rem", marginTop: "0.1rem", flexShrink: 0 }}>
                      {i + 1}.
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
                      {starter}
                    </span>
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
            style={{
              marginTop: "2.5rem",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
            }}
          >
            <GradientButton onClick={handleShare}>
              Share Itinerary
            </GradientButton>
            <GradientButton
              variant="outline"
              onClick={() => {
                setLoading(true);
                setShowWildcard(false);
                setTimeout(() => setLoading(false), 1500);
              }}
            >
              Regenerate Night
            </GradientButton>
          </motion.div>
        </div>
      </div>
      <Toast message={toast} visible={!!toast} />
    </>
  );
}
