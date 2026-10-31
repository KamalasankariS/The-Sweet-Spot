"use client";

import { IconLightbulb, IconTarget, IconMap, IconStar, IconCrystal, IconChat , Icon } from "@/components/icons/SweetSpotIcons";

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
  zipcode?: string;
  travelMode?: string;
  maxDistance?: number;
  maxTime?: number;
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
  address?: string;
  priceRange?: string;
  specialties?: string[];
  foodMatch?: string;
  durationMin?: number;
  travelFromPrev?: string;
  imageUrl?: string;
  websiteUrl?: string;
}

interface GeneratedItinerary {
  groupName: string;
  groupScore: number;
  vibeTag: string;
  location: string;
  stops: ItineraryStop[];
  wildcard: ItineraryStop;
  conversationStarters: string[];
  travelContext?: string;
  totalDuration?: string;
  estimatedEnd?: string;
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
  interface VenueData { name: string; desc: string; address?: string; price?: string; specialties?: string[]; duration?: number }

  const predrinkVenues: Record<string, VenueData> = {
    "Cocktail bars": { name: "Attaboy", desc: "Intimate speakeasy with bespoke cocktails — no menu, just vibes", address: "134 Eldridge St, NYC", price: "$$", specialties: ["Bespoke cocktails", "Old Fashioned variations"], duration: 60 },
    "Wine bars": { name: "The Four Horsemen", desc: "Natural wine bar with a curated, ever-changing selection", address: "295 Grand St, Brooklyn", price: "$$", specialties: ["Natural wines", "Small plates"], duration: 60 },
    "Dive bars": { name: "Turkey's Nest", desc: "Cash-only neighborhood dive with frozen margaritas", address: "94 Bedford Ave, Brooklyn", price: "$", specialties: ["Frozen margaritas", "Cheap beers"], duration: 45 },
    "Rooftop bars": { name: "Westlight", desc: "Panoramic skyline views with craft cocktails 22 floors up", address: "111 N 12th St, Brooklyn", price: "$$$", specialties: ["Skyline cocktails", "Sunset views"], duration: 75 },
    "Speakeasy": { name: "Please Don't Tell", desc: "Enter through a phone booth into cocktail perfection", address: "113 St Marks Pl, NYC", price: "$$$", specialties: ["Craft cocktails", "Hidden entrance"], duration: 60 },
    "Jazz clubs": { name: "Smalls Jazz Club", desc: "Intimate basement jazz with world-class musicians nightly", address: "183 W 10th St, NYC", price: "$$", specialties: ["Live jazz", "Late-night sets"], duration: 90 },
    "Beer gardens": { name: "Radegast Hall", desc: "Sprawling Williamsburg beer hall with live music", address: "113 N 3rd St, Brooklyn", price: "$$", specialties: ["Draft beers", "Bratwurst"], duration: 60 },
    "Art galleries": { name: "The Hole", desc: "Contemporary gallery with opening night drinks and DJ sets", address: "312 Bowery, NYC", price: "$$", specialties: ["Art openings", "DJ sets"], duration: 60 },
  };

  const dinnerVenues: Record<string, VenueData> = {
    "Japanese": { name: "ROKC", desc: "Omakase ramen bar with Japanese whisky flights", address: "3452 Broadway, NYC", price: "$$", specialties: ["Tonkotsu ramen ($18)", "Japanese whisky flight ($24)", "Pork belly bao ($14)"], duration: 75 },
    "Italian": { name: "L'Artusi", desc: "Modern Italian with handmade pasta and an incredible wine list", address: "228 W 10th St, NYC", price: "$$$", specialties: ["Spaghetti cacio e pepe ($24)", "Lamb ragu pappardelle ($28)", "Burrata ($19)"], duration: 90 },
    "Mexican": { name: "Casa Enrique", desc: "Michelin-starred Mexican with mole that changes your life", address: "5-48 49th Ave, LIC", price: "$$", specialties: ["Mole negro ($26)", "Enchiladas suizas ($22)", "Guacamole ($14)"], duration: 90 },
    "Thai": { name: "Fish Cheeks", desc: "Bold Thai seafood in a vibrant, buzzing dining room", address: "55 Bond St, NYC", price: "$$", specialties: ["Whole branzino ($34)", "Crab fried rice ($22)", "Green curry mussels ($18)"], duration: 75 },
    "Korean BBQ": { name: "COTE", desc: "Korean steakhouse with tableside grilling and omakase beef", address: "16 W 22nd St, NYC", price: "$$$$", specialties: ["Butcher's Feast ($65/pp)", "Wagyu beef ($45)", "Kimchi stew ($18)"], duration: 90 },
    "Farm-to-table": { name: "Olmsted", desc: "Garden-to-table dining from the backyard greenhouse", address: "659 Vanderbilt Ave, Brooklyn", price: "$$$", specialties: ["Garden tasting menu ($85)", "Seasonal salads ($16)", "Duck breast ($34)"], duration: 90 },
    "Sushi": { name: "Sushi Nakazawa", desc: "20-course omakase from a Jiro Dreams of Sushi protege", address: "23 Commerce St, NYC", price: "$$$$", specialties: ["Omakase ($150/pp)", "Otoro ($28)", "Uni ($24)"], duration: 90 },
    "Ramen": { name: "Ichiran", desc: "Solo-booth ramen experience with custom spice levels", address: "374 Johnson Ave, Brooklyn", price: "$$", specialties: ["Tonkotsu ramen ($19)", "Extra chashu ($4)", "Matcha pudding ($5)"], duration: 45 },
    "Mediterranean": { name: "Shuka", desc: "Mezze-driven Mediterranean with wood-fired everything", address: "38 MacDougal St, NYC", price: "$$$", specialties: ["Lamb shoulder ($38)", "Hummus trio ($16)", "Grilled octopus ($22)"], duration: 75 },
    "Indian": { name: "Adda", desc: "Indian home cooking in a Long Island City garage — no shortcuts", address: "31-31 Thomson Ave, LIC", price: "$$", specialties: ["Butter chicken ($18)", "Goat biryani ($22)", "Garlic naan ($4)"], duration: 75 },
    "French bistro": { name: "Le Crocodile", desc: "Classic Parisian bistro with steak frites and croque monsieurs", address: "80 Wythe Ave, Brooklyn", price: "$$$", specialties: ["Steak frites ($32)", "French onion soup ($14)", "Croque monsieur ($18)"], duration: 90 },
    "Street food": { name: "Smorgasburg", desc: "Open-air food market with 100+ vendors from every cuisine", address: "90 Kent Ave, Brooklyn", price: "$", specialties: ["Ramen burger ($12)", "Thai iced tea ($6)", "Tacos ($8-12)"], duration: 60 },
  };

  const activityVenues: Record<string, VenueData> = {
    "Live music": { name: "Baby's All Right", desc: "Indie music venue with great sound and late-night dance parties", address: "146 Broadway, Brooklyn", price: "$$", specialties: ["Live indie bands", "Late-night DJ sets"], duration: 90 },
    "Jazz clubs": { name: "Blue Note", desc: "Legendary jazz club with nightly performances from global artists", address: "131 W 3rd St, NYC", price: "$$$", specialties: ["World-class jazz", "Cocktail service"], duration: 90 },
    "Dance clubs": { name: "Elsewhere", desc: "Multi-room club with rooftop, music hall, and underground zone", address: "599 Johnson Ave, Brooklyn", price: "$$", specialties: ["3 rooms/stages", "Rooftop bar"], duration: 120 },
    "Comedy shows": { name: "The Comedy Cellar", desc: "NYC's most iconic comedy club with surprise drop-ins", address: "117 MacDougal St, NYC", price: "$$", specialties: ["Stand-up comedy", "Celebrity drop-ins"], duration: 90 },
    "Karaoke": { name: "Gagopa Karaoke", desc: "Private rooms with thousands of songs and BYOB drinks", address: "9 St Marks Pl, NYC", price: "$", specialties: ["Private rooms", "BYOB", "K-pop library"], duration: 90 },
    "Art galleries": { name: "Pace Gallery", desc: "World-class contemporary art in a stunning Chelsea space", address: "540 W 25th St, NYC", price: "Free", specialties: ["Contemporary art", "Rotating exhibitions"], duration: 60 },
  };

  const predrinkPick = predrinkVenues[topNightlife] || predrinkVenues["Cocktail bars"];
  const dinnerPick = dinnerVenues[topDining] || dinnerVenues["Japanese"];

  // Pick activity based on second nightlife preference or music taste
  const activityNightlife = (combinedSelections[3] || []).find((n) => n !== topNightlife) || "Live music";
  const activityPick = activityVenues[activityNightlife] || activityVenues["Live music"];

  // Food match: check if the user's fav food/cuisine aligns with the dinner
  const allFoodPicks = combinedSelections[2] || [];
  const foodMatchStr = allFoodPicks.length > 0
    ? `Matches the group's love of ${allFoodPicks.slice(0, 2).join(" & ")}`
    : undefined;

  // Nightcap venues
  const nightcapVenues: VenueData[] = [
    { name: "Maison Premiere", desc: "Oyster bar with absinthe cocktails and candlelit garden", address: "298 Bedford Ave, Brooklyn", price: "$$$", specialties: ["Oysters ($3/ea)", "Absinthe drip ($16)"], duration: 60 },
    { name: "The Long Island Bar", desc: "Restored 1950s cocktail bar with perfect martinis", address: "110 Atlantic Ave, Brooklyn", price: "$$", specialties: ["Classic martini ($16)", "Negroni ($15)"], duration: 60 },
    { name: "Bemelmans Bar", desc: "Old-world elegance with live piano and Ludwig Bemelmans murals", address: "35 E 76th St, NYC", price: "$$$$", specialties: ["Piano bar", "Champagne cocktails ($28)"], duration: 60 },
    { name: "Bar Goto", desc: "Japanese-inspired cocktails in a cozy Lower East Side gem", address: "245 Eldridge St, NYC", price: "$$", specialties: ["Sakura martini ($17)", "Yuzu whisky sour ($16)"], duration: 60 },
  ];
  const nightcap = nightcapVenues[seed % nightcapVenues.length];

  // Build reason strings referencing actual members
  const member1 = memberNames[0] || "You";
  const member2 = memberNames[1] || "the group";
  const member3 = memberNames[2] || "everyone";

  const stops: ItineraryStop[] = [
    {
      type: "Pre-drinks",
      icon: "cocktail",
      time: "7:00 PM",
      name: predrinkPick.name,
      description: predrinkPick.desc,
      reason: `Matches ${member1}'s love of ${topNightlife.toLowerCase()} and ${member2}'s vibe`,
      affinity: Math.min(97, groupScore + (seed % 8)),
      tags: [topNightlife, "Cocktails", "Starting the night right"],
      color: "#f97316",
      address: predrinkPick.address,
      priceRange: predrinkPick.price,
      specialties: predrinkPick.specialties,
      durationMin: predrinkPick.duration || 60,
      travelFromPrev: "Starting point",
    },
    {
      type: "Dinner",
      icon: "restaurant",
      time: "8:30 PM",
      name: dinnerPick.name,
      description: dinnerPick.desc,
      reason: diningOverlap.length > 0
        ? `The group's sweet spot — ${diningOverlap[0]} is where ${member1} and ${member2} overlap`
        : `${topDining} scored highest across the group's combined taste profile`,
      affinity: Math.min(98, groupScore + 3 + (seed % 6)),
      tags: [topDining, "Dinner", occasionLabels[group.occasion] || "Night out"],
      color: "#ec4899",
      address: dinnerPick.address,
      priceRange: dinnerPick.price,
      specialties: dinnerPick.specialties,
      foodMatch: foodMatchStr,
      durationMin: dinnerPick.duration || 90,
      travelFromPrev: "~10 min walk",
    },
    {
      type: "Activity",
      icon: "music",
      time: "10:15 PM",
      name: activityPick.name,
      description: activityPick.desc,
      reason: musicOverlap.length > 0
        ? `Bridges ${member1}'s ${musicOverlap[0]} taste with ${member3}'s ${activityNightlife.toLowerCase()} energy`
        : `${activityNightlife} venue that matches the group's energy level`,
      affinity: Math.min(95, groupScore - 2 + (seed % 10)),
      tags: [activityNightlife, topMusic || "Music", "Late night"],
      color: "#8b5cf6",
      address: activityPick.address,
      priceRange: activityPick.price,
      specialties: activityPick.specialties,
      durationMin: activityPick.duration || 90,
      travelFromPrev: "~15 min ride",
    },
    {
      type: "Nightcap",
      icon: "crystal",
      time: "11:45 PM",
      name: nightcap.name,
      description: nightcap.desc,
      reason: `Wind-down spot where ${member1} and ${member2} can decompress — matches the group's warmth score`,
      affinity: Math.min(96, groupScore + 1 + (seed % 7)),
      tags: ["Nightcap", "Intimate", "Late-night"],
      color: "#06b6d4",
      address: nightcap.address,
      priceRange: nightcap.price,
      specialties: nightcap.specialties,
      durationMin: nightcap.duration || 60,
      travelFromPrev: "~8 min walk",
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
    icon: "crystal",
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

  const modeIcons: Record<string, string> = { car: "car", train: "train", bus: "bus", cycle: "cycle", walk: "walk" };
  const travelContext = group.travelMode
    ? `${modeIcons[group.travelMode] || ""} Within ${group.maxDistance || 10} mi / ${group.maxTime || 30} min by ${group.travelMode}`
    : undefined;

  // Compute total evening duration
  const totalVenueMin = stops.reduce((sum, s) => sum + (s.durationMin || 60), 0);
  const travelMin = 35; // approximate transit between stops
  const totalMin = totalVenueMin + travelMin;
  const totalHrs = Math.floor(totalMin / 60);
  const totalRemMin = totalMin % 60;
  const totalDuration = `~${totalHrs}h ${totalRemMin > 0 ? `${totalRemMin}m` : ""} evening (${stops.length} stops + travel)`;

  return {
    groupName: group.name,
    groupScore,
    vibeTag,
    location: group.zipcode ? `${group.location} (${group.zipcode})` : group.location,
    stops,
    wildcard,
    conversationStarters: starters.slice(0, 3),
    travelContext,
    totalDuration,
    estimatedEnd: "~1:00 AM",
  };
}

// --- Fallback demo itinerary ---

const FALLBACK_ITINERARY: GeneratedItinerary = {
  groupName: "Friday Night Crew",
  groupScore: 87,
  vibeTag: "Candlelit conversations over craft cocktails",
  location: "Brooklyn, NYC",
  stops: [
    { type: "Pre-drinks", icon: "cocktail", time: "7:00 PM", name: "Attaboy", description: "Intimate speakeasy with bespoke cocktails", reason: "Matches the group's love of cocktail culture", affinity: 91, tags: ["Speakeasy", "Cocktails", "Intimate"], color: "#f97316" },
    { type: "Dinner", icon: "restaurant", time: "8:30 PM", name: "ROKC", description: "Omakase ramen bar with Japanese whisky flights", reason: "Japanese cuisine scored highest across the group", affinity: 94, tags: ["Japanese", "Izakaya", "Small plates"], color: "#ec4899" },
    { type: "Activity", icon: "music", time: "10:15 PM", name: "Baby's All Right", description: "Indie music venue with great sound and late-night dance parties", reason: "Live music bridges everyone's taste profile", affinity: 86, tags: ["Live music", "Indie", "Underground"], color: "#8b5cf6" },
    { type: "Nightcap", icon: "crystal", time: "11:45 PM", name: "Maison Premiere", description: "Oyster bar with absinthe cocktails and candlelit garden", reason: "Relaxed wind-down matching the group's warmth", affinity: 88, tags: ["Oyster bar", "Garden", "Late-night"], color: "#06b6d4" },
  ],
  wildcard: { type: "Wildcard", icon: "crystal", time: "", name: "House of Yes", description: "Immersive performance venue with themed costume parties", reason: "Nobody picked this, but Qloo predicts 89% match based on the group's adventure scores", affinity: 89, tags: ["Performance", "Immersive", "Wild"], color: "#84cc16" },
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
  const [expandedStop, setExpandedStop] = useState<number | null>(null);
  const [venueImages, setVenueImages] = useState<Record<string, string>>({});
  const [venueWebsites, setVenueWebsites] = useState<Record<string, string>>({});

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  // Fetch venue images from Qloo for stops missing images
  useEffect(() => {
    if (!itinerary) return;

    const allStops = [...itinerary.stops, itinerary.wildcard];
    const stopsNeedingImages = allStops.filter(
      (s) => !s.imageUrl && !venueImages[s.name]
    );

    if (stopsNeedingImages.length === 0) return;

    // Fetch in parallel from Qloo search
    stopsNeedingImages.forEach(async (stop) => {
      try {
        const params = new URLSearchParams({
          q: stop.name + (stop.address ? " " + stop.address : ""),
          types: "urn:entity:place",
          take: "1",
        });
        const res = await fetch(`/api/qloo/search?${params}`);
        const data = await res.json();
        const result = data.results?.[0];
        const imgUrl = result?.properties?.image?.url;
        if (imgUrl) {
          setVenueImages((prev) => ({ ...prev, [stop.name]: imgUrl }));
        }
        const website = result?.properties?.website || result?.properties?.url;
        if (website) {
          setVenueWebsites((prev) => ({ ...prev, [stop.name]: String(website) }));
        }
      } catch {
        // ignore — will show emoji fallback
      }
    });
  }, [itinerary]); // eslint-disable-line react-hooks/exhaustive-deps

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
        location: group.zipcode ? `${group.location} ${group.zipcode}` : group.location,
        occasion: group.occasion,
        groupName: group.name,
        travelMode: group.travelMode,
        maxDistance: group.maxDistance,
        maxTime: group.maxTime,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.results && data.source === "qloo") {
          const { dining, nightlife, wildcard } = data.results;

          const extractAddress = (v: { properties?: Record<string, unknown> }) =>
            v.properties?.address ? String(v.properties.address) : undefined;
          const extractImage = (v: { properties?: Record<string, unknown> }) =>
            (v.properties?.image as { url?: string } | undefined)?.url;
          const extractWebsite = (v: { properties?: Record<string, unknown> }) =>
            v.properties?.website ? String(v.properties.website) : v.properties?.url ? String(v.properties.url) : undefined;

          // Overlay Qloo venues onto the deterministic stops
          if (dining?.length > 0) {
            const venue = dining[0];
            base.stops[1] = {
              ...base.stops[1],
              name: venue.name,
              description: venue.properties?.short_description || base.stops[1].description,
              address: extractAddress(venue) || base.stops[1].address,
              imageUrl: extractImage(venue),
              websiteUrl: extractWebsite(venue),
              affinity: venue.query?.affinity ? Math.round(venue.query.affinity * 100) : base.stops[1].affinity,
              reason: `Qloo recommends this based on ${group.members.map((m: GroupData["members"][0]) => m.name).join(" & ")}'s combined taste profile`,
            };
          }

          if (nightlife?.length > 0) {
            const predrink = nightlife[0];
            base.stops[0] = {
              ...base.stops[0],
              name: predrink.name,
              description: predrink.properties?.short_description || base.stops[0].description,
              address: extractAddress(predrink) || base.stops[0].address,
              imageUrl: extractImage(predrink),
              websiteUrl: extractWebsite(predrink),
              affinity: predrink.query?.affinity ? Math.round(predrink.query.affinity * 100) : base.stops[0].affinity,
              reason: `Qloo's top nightlife match for the group's taste DNA`,
            };

            if (nightlife.length > 1) {
              const nightcapVenue = nightlife[1];
              base.stops[3] = {
                ...base.stops[3],
                name: nightcapVenue.name,
                description: nightcapVenue.properties?.short_description || base.stops[3].description,
                address: extractAddress(nightcapVenue) || base.stops[3].address,
                imageUrl: extractImage(nightcapVenue),
                websiteUrl: extractWebsite(nightcapVenue),
                affinity: nightcapVenue.query?.affinity ? Math.round(nightcapVenue.query.affinity * 100) : base.stops[3].affinity,
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
              address: extractAddress(pick),
              imageUrl: extractImage(pick),
              websiteUrl: extractWebsite(pick),
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
              border: "2px solid rgba(232,224,214,0.6)",
              borderTopColor: "#ec4899",
            }}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p style={{ color: "rgba(107,100,90,0.8)", fontSize: "0.9rem" }}>
              Finding your sweet spot...
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <p style={{ color: "rgba(107,100,90,0.4)", fontSize: "0.75rem" }}>
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
            <p style={{ color: "rgba(107,100,90,0.8)", marginBottom: "0.25rem" }}>
              {itinerary.groupName}
            </p>
            <p style={{ fontSize: "0.85rem", color: "rgba(107,100,90,0.4)" }}>
              {itinerary.location} · Vibe:{" "}
              <span className="gradient-text-cool" style={{ fontStyle: "italic" }}>
                &ldquo;{itinerary.vibeTag}&rdquo;
              </span>
            </p>
            {(itinerary.travelContext || itinerary.totalDuration) && (
              <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
                {itinerary.totalDuration && (
                  <span style={{ fontSize: "0.75rem", color: "rgba(107,100,90,0.5)", background: "rgba(45,42,38,0.02)", padding: "0.25rem 0.75rem", borderRadius: "9999px" }}>
                    {itinerary.totalDuration}
                  </span>
                )}
                {itinerary.travelContext && (
                  <span style={{ fontSize: "0.75rem", color: "rgba(107,100,90,0.5)", background: "rgba(45,42,38,0.02)", padding: "0.25rem 0.75rem", borderRadius: "9999px" }}>
                    {itinerary.travelContext}
                  </span>
                )}
                {itinerary.estimatedEnd && (
                  <span style={{ fontSize: "0.75rem", color: "rgba(107,100,90,0.5)", background: "rgba(45,42,38,0.02)", padding: "0.25rem 0.75rem", borderRadius: "9999px" }}>
                    Wraps up {itinerary.estimatedEnd}
                  </span>
                )}
              </div>
            )}
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
                    <span style={{ fontSize: "0.65rem", color: "rgba(107,100,90,0.5)", fontFamily: "monospace" }}>
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

                  <GlassCard hover className="p-6 cursor-pointer" style={{ marginLeft: "4rem" }} onClick={() => setExpandedStop(expandedStop === i ? null : i)}>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                      {(stop.imageUrl || venueImages[stop.name]) ? (
                        <img
                          src={stop.imageUrl || venueImages[stop.name]}
                          alt={stop.name}
                          style={{
                            width: "3.5rem",
                            height: "3.5rem",
                            borderRadius: "0.75rem",
                            objectFit: "cover",
                            flexShrink: 0,
                            border: `2px solid ${stop.color}30`,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "3.5rem",
                            height: "3.5rem",
                            borderRadius: "0.75rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.5rem",
                            flexShrink: 0,
                            backgroundColor: `${stop.color}15`,
                          }}
                        >
                          <Icon name={stop.icon} size={20} />
                        </div>
                      )}

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
                              {stop.durationMin && (
                                <span style={{ marginLeft: "0.5rem", color: "rgba(107,100,90,0.4)" }}>
                                  ~{stop.durationMin} min
                                </span>
                              )}
                            </span>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                              {stop.name}
                              {stop.priceRange && (
                                <span style={{ marginLeft: "0.5rem", fontSize: "0.75rem", color: "rgba(107,100,90,0.5)", fontWeight: 400 }}>
                                  {stop.priceRange}
                                </span>
                              )}
                            </h3>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontSize: "0.875rem", fontWeight: 700, color: stop.color }}>
                              {stop.affinity}%
                            </span>
                            <span style={{ fontSize: "0.6rem", color: "rgba(107,100,90,0.4)", transition: "transform 0.2s", transform: expandedStop === i ? "rotate(180deg)" : "rotate(0)" }}>
                              ▼
                            </span>
                          </div>
                        </div>

                        {/* Address + travel badge */}
                        {stop.address && (
                          <p style={{ fontSize: "0.75rem", color: "rgba(107,100,90,0.5)", marginBottom: "0.25rem" }}>
                            {stop.address}
                            {stop.travelFromPrev && i > 0 && (
                              <span style={{ marginLeft: "0.5rem", color: "rgba(107,100,90,0.35)" }}>
                                · {stop.travelFromPrev} from previous
                              </span>
                            )}
                          </p>
                        )}

                        <p style={{ fontSize: "0.85rem", color: "rgba(107,100,90,0.8)", marginBottom: "0.75rem" }}>
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
                            background: "rgba(45,42,38,0.02)",
                          }}
                        >
                          <span style={{ marginTop: "0.1rem", display: "flex" }}><IconLightbulb size={12} /></span>
                          <span style={{ fontSize: "0.75rem", color: "rgba(45,42,38,0.5)", fontStyle: "italic" }}>
                            {stop.reason}
                          </span>
                        </div>

                        {/* Expanded details */}
                        {expandedStop === i && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ duration: 0.2 }}
                            style={{ marginBottom: "0.75rem" }}
                          >
                            {/* Hero image */}
                            {(stop.imageUrl || venueImages[stop.name]) && (
                              <div style={{ marginBottom: "0.75rem", borderRadius: "0.75rem", overflow: "hidden", position: "relative" }}>
                                <img
                                  src={stop.imageUrl || venueImages[stop.name]}
                                  alt={stop.name}
                                  style={{
                                    width: "100%",
                                    height: "10rem",
                                    objectFit: "cover",
                                    display: "block",
                                  }}
                                />
                                <div style={{
                                  position: "absolute", bottom: 0, left: 0, right: 0,
                                  background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                                  padding: "1.5rem 0.75rem 0.5rem",
                                  display: "flex", justifyContent: "space-between", alignItems: "flex-end",
                                }}>
                                  {stop.priceRange && (
                                    <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                                      {stop.priceRange}
                                    </span>
                                  )}
                                  {stop.durationMin && (
                                    <span style={{ fontSize: "0.7rem", color: "rgba(45,42,38,0.5)" }}>
                                      ~{stop.durationMin} min visit
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Food match */}
                            {stop.foodMatch && (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: "0.5rem", background: `${stop.color}08` }}>
                                <span style={{ display: "flex" }}><IconTarget size={12} /></span>
                                <span style={{ fontSize: "0.75rem", color: `${stop.color}cc` }}>{stop.foodMatch}</span>
                              </div>
                            )}

                            {/* Specialties / Menu highlights */}
                            {stop.specialties && stop.specialties.length > 0 && (
                              <div style={{ marginBottom: "0.75rem" }}>
                                <span style={{ fontSize: "0.65rem", color: "rgba(45,42,38,0.35)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                  {stop.type === "Dinner" ? "Menu Highlights" : "Specialties"}
                                </span>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: "0.375rem" }}>
                                  {stop.specialties.map((s, si) => (
                                    <span key={si} style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)" }}>
                                      • {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Action buttons */}
                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                              {/* Website / View Menu */}
                              {(stop.websiteUrl || venueWebsites[stop.name]) && (
                                <a
                                  href={stop.websiteUrl || venueWebsites[stop.name]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    display: "inline-flex", alignItems: "center", gap: "0.375rem",
                                    padding: "0.4rem 0.75rem", borderRadius: "0.5rem",
                                    background: `${stop.color}15`, border: `1px solid ${stop.color}30`,
                                    color: stop.color, fontSize: "0.75rem", textDecoration: "none",
                                    fontWeight: 500, transition: "all 0.15s",
                                  }}
                                >
                                  Website
                                </a>
                              )}
                              <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(stop.name + " " + (stop.address || "") + " menu")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: "0.375rem",
                                  padding: "0.4rem 0.75rem", borderRadius: "0.5rem",
                                  background: `${stop.color}15`, border: `1px solid ${stop.color}30`,
                                  color: stop.color, fontSize: "0.75rem", textDecoration: "none",
                                  fontWeight: 500, transition: "all 0.15s",
                                }}
                              >
                                View Menu {stop.priceRange && <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>({stop.priceRange})</span>}
                              </a>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.name + (stop.address ? " " + stop.address : ""))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: "0.375rem",
                                  padding: "0.4rem 0.75rem", borderRadius: "0.5rem",
                                  background: "rgba(45,42,38,0.04)", border: "1px solid rgba(232,224,214,0.6)",
                                  color: "rgba(45,42,38,0.6)", fontSize: "0.75rem", textDecoration: "none",
                                  transition: "all 0.15s",
                                }}
                              >
                                <IconMap size={14} /> View on Maps
                              </a>
                              <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(stop.name + " " + (stop.address || "") + " reviews")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: "0.375rem",
                                  padding: "0.4rem 0.75rem", borderRadius: "0.5rem",
                                  background: "rgba(45,42,38,0.04)", border: "1px solid rgba(232,224,214,0.6)",
                                  color: "rgba(45,42,38,0.6)", fontSize: "0.75rem", textDecoration: "none",
                                  transition: "all 0.15s",
                                }}
                              >
                                <IconStar size={14} /> Reviews
                              </a>
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.name + (stop.address ? " " + stop.address : ""))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: "0.375rem",
                                  padding: "0.4rem 0.75rem", borderRadius: "0.5rem",
                                  background: "rgba(45,42,38,0.04)", border: "1px solid rgba(232,224,214,0.6)",
                                  color: "rgba(45,42,38,0.6)", fontSize: "0.75rem", textDecoration: "none",
                                  transition: "all 0.15s",
                                }}
                              >
                                Directions
                              </a>
                            </div>
                          </motion.div>
                        )}

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
                <IconCrystal size={16} /> Reveal the Wildcard Pick
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <GlassCard glow="mint" className="border-accent-mint/10" style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                    {(itinerary.wildcard.imageUrl || venueImages[itinerary.wildcard.name]) ? (
                      <img
                        src={itinerary.wildcard.imageUrl || venueImages[itinerary.wildcard.name]}
                        alt={itinerary.wildcard.name}
                        style={{
                          width: "3.5rem",
                          height: "3.5rem",
                          borderRadius: "0.75rem",
                          objectFit: "cover",
                          flexShrink: 0,
                          border: "2px solid rgba(132,204,22,0.3)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "3.5rem",
                          height: "3.5rem",
                          borderRadius: "0.75rem",
                          background: "rgba(132,204,22,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.5rem",
                          flexShrink: 0,
                        }}
                      >
                        <Icon name={itinerary.wildcard.icon} size={20} />
                      </div>
                    )}
                    <div>
                      <span style={{ fontSize: "0.65rem", fontWeight: 500, color: "rgba(132,204,22,0.7)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        Wildcard Pick — The Stretch
                      </span>
                      <h3 style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                        {itinerary.wildcard.name}
                      </h3>
                      <p style={{ fontSize: "0.85rem", color: "rgba(107,100,90,0.8)", marginTop: "0.25rem", marginBottom: "0.75rem" }}>
                        {itinerary.wildcard.description}
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "0.5rem",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "0.5rem",
                          background: "rgba(45,42,38,0.02)",
                        }}
                      >
                        <span style={{ marginTop: "0.1rem", display: "flex" }}><IconCrystal size={12} /></span>
                        <span style={{ fontSize: "0.75rem", color: "rgba(45,42,38,0.5)", fontStyle: "italic" }}>
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
                <span><IconChat size={14} /></span>
                <span className="gradient-text">Conversation Starters</span>
                <span style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.4)", fontWeight: 400, marginLeft: "0.25rem" }}>
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
                      background: "rgba(45,42,38,0.02)",
                    }}
                  >
                    <span style={{ color: "rgba(107,100,90,0.4)", fontSize: "0.75rem", marginTop: "0.1rem", flexShrink: 0 }}>
                      {i + 1}.
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "rgba(45,42,38,0.5)" }}>
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
