"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { AmbientTheme, useAmbientTheme } from "@/components/ui/AmbientTheme";
import { Navbar } from "@/components/layout/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GradientButton } from "@/components/ui/GradientButton";
import { Toast } from "@/components/ui/Toast";
import { EventIllustration } from "@/components/ui/EventIllustrations";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { PhotonAutocomplete } from "@/components/ui/PhotonAutocomplete";
import { LocalAutocomplete } from "@/components/ui/LocalAutocomplete";
import { STATES, CITIES, hasStaticData } from "@/lib/world-geo";
import { ALL_COUNTRIES } from "@/lib/countries";
import { validateZipcodeFormat, countryUsesPostalCode } from "@/lib/zipcode";
import { useItineraryHistory } from "@/hooks/useItineraryHistory";
import { StopReminderPrompt, useStopReminders } from "@/components/ui/StopReminderPrompt";
import { useAuth } from "@/hooks/useAuth";
import { IconPin, IconSparkle, IconBack, IconMusic , Icon } from "@/components/icons/SweetSpotIcons";

// --- Types ---

interface PlaceResult {
  name: string;
  entity_id: string;
  imageUrl?: string;
  address?: string;
  description?: string;
  affinity?: number;
  distanceMi?: number;
}

interface SuggestionCategory {
  category: string;
  icon: string;
  places: PlaceResult[];
}

interface ItineraryStop {
  id: string;
  category: string;
  categoryIcon: string;
  place?: PlaceResult;
  customName?: string;
  notes?: string;
  time?: string;
}

// --- Constants ---

const EVENT_TYPES = [
  { id: "date-night", label: "Date Night", icon: "magic", color: "#E8788A" },
  { id: "friends-hangout", label: "Friends Hangout", icon: "crystal", color: "#B8A0D2" },
  { id: "team-outing", label: "Team Outing", icon: "building", color: "#8CBFD4" },
  { id: "solo-adventure", label: "Solo Adventure", icon: "map", color: "#8AC4A0" },
  { id: "celebration", label: "Celebration", icon: "celebrate", color: "#E8B88A" },
  { id: "family-kids", label: "Family / Kids", icon: "heart", color: "#F6C958" },
  { id: "custom", label: "Custom", icon: "sparkle", color: "#E8788A" },
];

const TIME_OF_DAY = [
  { id: "morning", label: "Morning", icon: "sunrise", hint: "Brunch, hikes, markets, coffee" },
  { id: "afternoon", label: "Afternoon", icon: "sun", hint: "Lunch, museums, parks, shopping" },
  { id: "evening", label: "Evening", icon: "sunrise", hint: "Dinner, shows, cocktails, sunsets" },
  { id: "late-night", label: "Late Night", icon: "crystal", hint: "Bars, clubs, karaoke, late eats" },
];

// Which time slots make sense per event type
const EVENT_TIME_FILTER: Record<string, string[]> = {
  "date-night": ["evening", "late-night"],
  "friends-hangout": ["afternoon", "evening", "late-night"],
  "team-outing": ["morning", "afternoon", "evening"],
  "solo-adventure": ["morning", "afternoon", "evening"],
  "celebration": ["afternoon", "evening", "late-night"],
  "family-kids": ["morning", "afternoon", "evening"],
  "custom": ["morning", "afternoon", "evening", "late-night"],
};

const FOOD_STOP_IDS = new Set(["restaurant", "drinks"]);

// Font family per event type
function getEventFont(eventType: string): string {
  switch (eventType) {
    case "date-night": return "var(--font-fleur-de-leah)";
    case "family-kids": return "var(--font-schoolbell)";
    case "team-outing": return "var(--font-playfair)";
    case "celebration": return "var(--font-windsong)";
    case "friends-hangout": return "var(--font-henny-penny)";
    case "solo-adventure": return "var(--font-sedgwick)";
    case "custom": return "var(--font-almendra)";
    default: return "var(--font-yuyu)";
  }
}

// Resolve background image based on event type + sub-vibe (orientation / crew)
function getEventBackground(eventType: string, vibe: string): string | null {
  if (eventType === "date-night") {
    const dateMap: Record<string, string[]> = {
      straight: ["/backgrounds/straight-couple-date-morning.png", "/backgrounds/straight-couple-date-noon.png", "/backgrounds/straight-couple-date-night.png"],
      gay: ["/backgrounds/gay-couple-date-morning.png", "/backgrounds/gay-couple-date-noon.png", "/backgrounds/gay-couple-date.png"],
      lesbian: ["/backgrounds/lesbian-couple-date-morning.png", "/backgrounds/lesbian-couple-date-noon.png", "/backgrounds/lesbian-couple-date.png"],
    };
    const imgs = dateMap[vibe] || dateMap.straight;
    return imgs[Math.floor(Math.random() * imgs.length)];
  }

  if (eventType === "friends-hangout") {
    const crewMap: Record<string, string[]> = {
      guys: ["/backgrounds/boys-party.png", "/backgrounds/boys-party-1.png", "/backgrounds/boys-party-2.png"],
      girls: ["/backgrounds/girls-party.png", "/backgrounds/girls-party-1.png"],
      mixed: ["/backgrounds/get-together.png"],
    };
    const imgs = crewMap[vibe] || ["/backgrounds/get-together.png"];
    return imgs[Math.floor(Math.random() * imgs.length)];
  }

  const map: Record<string, string[]> = {
    "team-outing": ["/backgrounds/office-event.png"],
    "solo-adventure": ["/backgrounds/fun-activity.png"],
    "celebration": ["/backgrounds/fun-party.png", "/backgrounds/birthday-party-girl.png", "/backgrounds/graduation-party-1.png", "/backgrounds/bachelor-party.png", "/backgrounds/bachelorette-party.png", "/backgrounds/baby-shower.png"],
    "family-kids": ["/backgrounds/family-party.png", "/backgrounds/children-picnic.png", "/backgrounds/children-formal-picnic.png", "/backgrounds/children-informal-picnic.png"],
    "custom": ["/backgrounds/fun-activity.png", "/backgrounds/winter-event.png", "/backgrounds/pet-events.png"],
  };

  const imgs = map[eventType];
  if (!imgs || imgs.length === 0) return null;
  return imgs[Math.floor(Math.random() * imgs.length)];
}

const STOP_CATEGORIES = [
  { id: "activity", label: "Activity / Recreation", icon: "target", examples: "NBA game, arcade, bowling, escape room, park stroll" },
  { id: "restaurant", label: "Restaurant / Dining", icon: "restaurant", examples: "Fine dining, street food, cafe, brunch spot" },
  { id: "drinks", label: "Drinks / Bar", icon: "cocktail", examples: "Cocktail bar, rooftop, wine bar, brewery" },
  { id: "entertainment", label: "Entertainment", icon: "music", examples: "Live music, comedy show, theater, karaoke" },
  { id: "scenic", label: "Scenic / Chill", icon: "sunrise", examples: "Waterfront, park, viewpoint, garden" },
  { id: "nightlife", label: "Nightlife / Club", icon: "disco", examples: "Dance club, lounge, late-night venue" },
  { id: "culture", label: "Culture / Art", icon: "palette", examples: "Museum, gallery, bookstore, market" },
  { id: "other", label: "Other", icon: "pin", examples: "Anything else — your call" },
];

const COUNTRY_OPTIONS = ALL_COUNTRIES.map((c) => ({ value: c.code, label: c.name, icon: c.flag }));

const DIETARY_OPTIONS = [
  { id: "vegetarian", label: "Vegetarian", icon: "tree" },
  { id: "vegan", label: "Vegan", icon: "tree" },
  { id: "gluten-free", label: "Gluten-Free", icon: "tree" },
  { id: "dairy-free", label: "Dairy-Free", icon: "coffee" },
  { id: "nut-free", label: "Nut-Free", icon: "tree" },
  { id: "shellfish-free", label: "Shellfish-Free", icon: "restaurant" },
  { id: "halal", label: "Halal", icon: "restaurant" },
  { id: "kosher", label: "Kosher", icon: "star" },
  { id: "pescatarian", label: "Pescatarian", icon: "restaurant" },
  { id: "soy-free", label: "Soy-Free", icon: "tree" },
  { id: "egg-free", label: "Egg-Free", icon: "restaurant" },
  { id: "low-carb", label: "Low-Carb", icon: "restaurant" },
];

// --- Place Search Hook ---

function usePlaceSearch() {
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback((query: string, location?: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.length < 2) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({
          q: query,
          types: "urn:entity:place",
          take: "6",
        });
        if (location) params.set("location", location);
        const res = await fetch(`/api/qloo/search?${params}`);
        const data = await res.json();
        setResults(
          (data.results || []).map((r: Record<string, unknown>) => ({
            name: r.name as string,
            entity_id: r.entity_id as string,
            imageUrl: (r.properties as Record<string, unknown>)?.image
              ? ((r.properties as Record<string, unknown>).image as Record<string, unknown>)?.url as string
              : undefined,
            address: (r.properties as Record<string, unknown>)?.address as string | undefined,
            description: (r.properties as Record<string, unknown>)?.short_description as string | undefined,
          }))
        );
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 80);
  }, []);

  const clear = useCallback(() => setResults([]), []);

  return { results, searching, search, clear };
}

// --- Custom Time Picker ---

function TimePicker({ value, onChange, required, accentColor }: {
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  accentColor: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Parse current value
  const parts = value ? value.split(":") : ["", ""];
  const hour24 = parts[0] ? parseInt(parts[0]) : -1;
  const minute = parts[1] ? parseInt(parts[1]) : -1;
  const isPM = hour24 >= 12;
  const hour12 = hour24 > 12 ? hour24 - 12 : hour24 === 0 ? 12 : hour24;

  const formatTime = (h12: number, m: number, pm: boolean) => {
    const h24 = pm ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12);
    return `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const displayStr = value
    ? `${hour12}:${String(minute).padStart(2, "0")} ${isPM ? "PM" : "AM"}`
    : "";

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const setHour = (h: number) => {
    const m = minute >= 0 ? minute : 0;
    const pm = hour24 >= 0 ? isPM : true;
    onChange(formatTime(h, m, pm));
  };
  const setMin = (m: number) => {
    const h = hour12 > 0 ? hour12 : 12;
    onChange(formatTime(h, m, isPM));
  };
  const toggleAMPM = () => {
    if (hour24 < 0) return;
    onChange(formatTime(hour12, minute >= 0 ? minute : 0, !isPM));
  };

  const isEmpty = !value;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: "0.35rem",
          padding: "0.35rem 0.6rem", borderRadius: "0.5rem", cursor: "pointer",
          background: isEmpty ? "rgba(232,120,138,0.06)" : `${accentColor}10`,
          border: `1.5px solid ${isEmpty ? "rgba(232,120,138,0.35)" : accentColor + "30"}`,
          color: isEmpty ? "rgba(107,100,90,0.4)" : "#2D2A26",
          fontSize: "0.75rem", fontFamily: "monospace", transition: "all 0.15s",
          minWidth: "6.5rem", justifyContent: "center",
        }}
      >
        {/* Clock SVG */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={isEmpty ? "rgba(232,120,138,0.5)" : accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        {displayStr || "Set time"}
        {required && isEmpty && <span style={{ color: "rgba(220,38,38,0.6)", fontSize: "0.6rem" }}>*</span>}
      </button>

      {/* Dropdown picker */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "absolute", top: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)",
            zIndex: 50, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)",
            borderRadius: "0.75rem", border: "1px solid rgba(232,224,214,0.5)",
            boxShadow: "0 8px 32px rgba(45,42,38,0.12)", padding: "0.6rem",
            display: "flex", gap: "0.25rem", alignItems: "stretch",
          }}
        >
          {/* Hours column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", maxHeight: "10rem", overflowY: "auto", paddingRight: "0.15rem" }}>
            <div style={{ fontSize: "0.5rem", color: "rgba(107,100,90,0.4)", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.15rem" }}>Hr</div>
            {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => (
              <button
                key={h} type="button"
                onClick={() => setHour(h)}
                style={{
                  width: "2rem", padding: "0.3rem 0", borderRadius: "0.35rem", border: "none",
                  background: hour12 === h ? accentColor : "transparent",
                  color: hour12 === h ? "white" : "rgba(45,42,38,0.7)",
                  fontSize: "0.75rem", fontWeight: hour12 === h ? 600 : 400,
                  cursor: "pointer", transition: "all 0.1s", textAlign: "center",
                }}
              >
                {h}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: "1px", background: "rgba(232,224,214,0.5)", margin: "0.5rem 0.1rem" }} />

          {/* Minutes column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", maxHeight: "10rem", overflowY: "auto", paddingRight: "0.15rem" }}>
            <div style={{ fontSize: "0.5rem", color: "rgba(107,100,90,0.4)", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.15rem" }}>Min</div>
            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
              <button
                key={m} type="button"
                onClick={() => setMin(m)}
                style={{
                  width: "2rem", padding: "0.3rem 0", borderRadius: "0.35rem", border: "none",
                  background: minute === m ? accentColor : "transparent",
                  color: minute === m ? "white" : "rgba(45,42,38,0.7)",
                  fontSize: "0.75rem", fontWeight: minute === m ? 600 : 400,
                  cursor: "pointer", transition: "all 0.1s", textAlign: "center",
                }}
              >
                {String(m).padStart(2, "0")}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: "1px", background: "rgba(232,224,214,0.5)", margin: "0.5rem 0.1rem" }} />

          {/* AM/PM */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", justifyContent: "center" }}>
            {(["AM", "PM"] as const).map((label) => (
              <button
                key={label} type="button"
                onClick={() => {
                  if ((label === "PM") !== isPM) toggleAMPM();
                  else if (hour24 < 0) {
                    onChange(formatTime(12, 0, label === "PM"));
                  }
                }}
                style={{
                  padding: "0.4rem 0.5rem", borderRadius: "0.35rem", border: "none",
                  background: (label === "PM") === isPM && hour24 >= 0 ? accentColor : "transparent",
                  color: (label === "PM") === isPM && hour24 >= 0 ? "white" : "rgba(45,42,38,0.7)",
                  fontSize: "0.7rem", fontWeight: 600, cursor: "pointer", transition: "all 0.1s",
                  letterSpacing: "0.05em",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// --- Stop Editor Component ---

function StopEditor({
  stop,
  index,
  location,
  onUpdate,
  onRemove,
  eventColor,
}: {
  stop: ItineraryStop;
  index: number;
  location: string;
  onUpdate: (id: string, updates: Partial<ItineraryStop>) => void;
  onRemove: (id: string) => void;
  eventColor: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(!stop.place && !stop.customName);
  const { results, searching, search, clear } = usePlaceSearch();

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    search(q, location);
  };

  const selectPlace = (place: PlaceResult) => {
    onUpdate(stop.id, { place, customName: undefined });
    setSearchQuery("");
    setShowSearch(false);
    clear();
  };

  const useCustom = () => {
    if (searchQuery.trim()) {
      onUpdate(stop.id, { customName: searchQuery.trim(), place: undefined });
      setSearchQuery("");
      setShowSearch(false);
      clear();
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, height: 0 }}
      style={{ position: "relative" }}
    >
      {/* Timeline connector */}
      {index > 0 && (
        <div style={{
          position: "absolute", left: "1.25rem", top: "-0.75rem", height: "0.75rem",
          width: "2px", background: `${eventColor}30`,
        }} />
      )}

      <GlassCard hover={false} style={{ padding: "1rem 1.25rem" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          {/* Stop number + icon */}
          <div style={{
            width: "2.5rem", height: "2.5rem", borderRadius: "0.75rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.25rem", flexShrink: 0, position: "relative",
            background: stop.place?.imageUrl
              ? "transparent"
              : `${eventColor}15`,
            overflow: "hidden",
          }}>
            {stop.place?.imageUrl ? (
              <img src={stop.place.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              stop.categoryIcon
            )}
            <span style={{
              position: "absolute", top: "-2px", left: "-2px",
              background: eventColor, color: "#2D2A26", fontSize: "0.55rem", fontWeight: 700,
              width: "1rem", height: "1rem", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {index + 1}
            </span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Category label */}
            <span style={{ fontSize: "0.6rem", color: `${eventColor}99`, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}>
              {stop.category}
            </span>

            {/* Selected place or search */}
            {(stop.place || stop.customName) && !showSearch ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 600 }}>{stop.place?.name || stop.customName}</h4>
                  <button
                    onClick={() => setShowSearch(true)}
                    style={{ background: "none", border: "none", color: "rgba(107,100,90,0.6)", fontSize: "0.6rem", cursor: "pointer" }}
                  >
                    change
                  </button>
                </div>
                {stop.place?.address && (
                  <p style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.5)", display: "flex", alignItems: "center", gap: "0.25rem" }}><IconPin size={12} /> {stop.place.address}</p>
                )}
                {stop.place?.description && (
                  <p style={{ fontSize: "0.75rem", color: "rgba(107,100,90,0.7)", marginTop: "0.125rem" }}>{stop.place.description}</p>
                )}
              </div>
            ) : (
              <div style={{ marginTop: "0.25rem" }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") useCustom(); }}
                  placeholder="Search for a place or type your own..."
                  autoFocus
                  style={{
                    width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
                    background: "rgba(45,42,38,0.03)", border: "1px solid rgba(232,224,214,0.6)",
                    color: "#2D2A26", fontSize: "0.85rem", outline: "none",
                  }}
                />

                {/* Search results dropdown */}
                {(results.length > 0 || searching) && (
                  <div style={{
                    marginTop: "0.375rem", borderRadius: "0.5rem", overflow: "hidden",
                    background: "rgba(255,255,255,0.97)", border: "1px solid rgba(232,224,214,0.6)",
                    maxHeight: "12rem", overflowY: "auto",
                  }}>
                    {searching && results.length === 0 ? (
                      <div style={{ padding: "0.75rem", textAlign: "center", color: "rgba(107,100,90,0.6)", fontSize: "0.75rem" }}>
                        Searching...
                      </div>
                    ) : (
                      results.map((r) => (
                        <button
                          key={r.entity_id}
                          onClick={() => selectPlace(r)}
                          style={{
                            width: "100%", display: "flex", alignItems: "center", gap: "0.5rem",
                            padding: "0.5rem 0.75rem", background: "transparent", border: "none",
                            borderBottom: "1px solid rgba(232,224,214,0.4)", color: "#2D2A26",
                            cursor: "pointer", textAlign: "left", transition: "background 0.1s",
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = "rgba(45,42,38,0.04)"; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                          {r.imageUrl ? (
                            <img src={r.imageUrl} alt="" style={{ width: "2rem", height: "2rem", borderRadius: "0.375rem", objectFit: "cover", flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: "2rem", height: "2rem", borderRadius: "0.375rem", background: `${eventColor}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: eventColor }}>
                              <IconPin size={14} />
                            </div>
                          )}
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: "0.8rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                            {r.address && (
                              <div style={{ fontSize: "0.65rem", color: "rgba(107,100,90,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.address}</div>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                    {/* Use custom option */}
                    {searchQuery.trim().length >= 2 && (
                      <button
                        onClick={useCustom}
                        style={{
                          width: "100%", padding: "0.5rem 0.75rem", background: "transparent",
                          border: "none", borderTop: "1px solid rgba(232,224,214,0.5)",
                          color: eventColor, cursor: "pointer", textAlign: "left", fontSize: "0.75rem",
                        }}
                      >
                        + Use &quot;{searchQuery.trim()}&quot; as custom place
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Time (required) + Notes */}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", alignItems: "center" }}>
              <TimePicker
                value={stop.time || ""}
                onChange={(val) => onUpdate(stop.id, { time: val })}
                required
                accentColor={eventColor}
              />
              <input
                type="text"
                value={stop.notes || ""}
                onChange={(e) => onUpdate(stop.id, { notes: e.target.value })}
                placeholder="Quick note (optional)"
                style={{
                  flex: 1, padding: "0.3rem 0.5rem", borderRadius: "0.375rem",
                  background: "rgba(45,42,38,0.02)", border: "1px solid rgba(232,224,214,0.5)",
                  color: "#2D2A26", fontSize: "0.7rem", outline: "none",
                }}
              />
            </div>
          </div>

          {/* Remove button */}
          <button
            onClick={() => onRemove(stop.id)}
            style={{
              background: "rgba(45,42,38,0.04)", border: "none", borderRadius: "50%",
              width: "1.5rem", height: "1.5rem", display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", color: "rgba(107,100,90,0.5)",
              fontSize: "0.6rem", flexShrink: 0, marginTop: "0.25rem",
            }}
          >
            ✕
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// --- Wizard helpers (defined outside PlanPage to avoid remount on state change) ---

function PinkGlowBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: "#1a0a12" }}>
      {/* Large pink glow */}
      <motion.div
        className="absolute"
        style={{ top: "-10%", left: "-5%", width: "70%", height: "80%", borderRadius: "50%", background: "radial-gradient(circle, rgba(232,120,138,0.45) 0%, rgba(184,160,210,0.2) 50%, transparent 80%)", filter: "blur(60px)" }}
        animate={{ x: [0, 30, -20, 0], y: [0, -20, 15, 0], scale: [1, 1.05, 0.97, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Lavender glow */}
      <motion.div
        className="absolute"
        style={{ bottom: "-15%", right: "-10%", width: "65%", height: "75%", borderRadius: "50%", background: "radial-gradient(circle, rgba(184,160,210,0.4) 0%, rgba(140,191,212,0.15) 50%, transparent 80%)", filter: "blur(50px)" }}
        animate={{ x: [0, -25, 15, 0], y: [0, 20, -30, 0], scale: [1, 0.95, 1.05, 1] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Warm center highlight */}
      <motion.div
        className="absolute"
        style={{ top: "30%", left: "25%", width: "50%", height: "50%", borderRadius: "50%", background: "radial-gradient(circle, rgba(246,201,88,0.12) 0%, transparent 70%)", filter: "blur(40px)" }}
        animate={{ scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Sparkle particles */}
      {[...Array(18)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${2 + Math.random() * 3}px`, height: `${2 + Math.random() * 3}px`,
            top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
            background: "white",
          }}
          animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 4, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function WizardCard({ children, stepKey, stepNum, totalSteps, accentColor, backgroundImage, pinkGlow }: {
  children: React.ReactNode;
  stepKey: string;
  stepNum: number;
  totalSteps: number;
  accentColor: string;
  backgroundImage?: string | null;
  pinkGlow?: boolean;
}) {
  const [minimized, setMinimized] = useState(false);
  const hasDarkBg = !!(backgroundImage || pinkGlow);
  return (
    <>
      {backgroundImage ? <AmbientTheme theme={null} backgroundImage={backgroundImage} /> : pinkGlow ? <PinkGlowBackground /> : <AnimatedBackground />}
      <Navbar />

      {/* Minimized: floating pill to restore */}
      <AnimatePresence>
        {minimized && (
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.3 }}
            onClick={() => setMinimized(false)}
            style={{
              position: "fixed", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
              zIndex: 40, padding: "0.75rem 1.5rem", borderRadius: "2rem",
              background: "rgba(255,255,255,0.2)", backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.3)",
              color: "white", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: "0.5rem",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            Continue Planning
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main card */}
      <AnimatePresence>
        {!minimized && (
          <div style={{ minHeight: "100vh", padding: "7rem 1.5rem 3rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.div
              key={stepKey}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, y: 40, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              style={{ width: "100%", maxWidth: "28rem" }}
            >
              <GlassCard hover={false} style={{
                padding: "2.5rem 2rem",
                position: "relative",
                ...(hasDarkBg ? {
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                } : {}),
              }}>
                {/* Minimize button */}
                <button
                  onClick={() => setMinimized(true)}
                  title="Minimize to view background"
                  style={{
                    position: "absolute", top: "0.75rem", right: "0.75rem",
                    background: "none", border: "none", cursor: "pointer",
                    color: hasDarkBg ? "rgba(255,255,255,0.5)" : "rgba(107,100,90,0.4)",
                    padding: "0.25rem", borderRadius: "0.25rem",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = hasDarkBg ? "rgba(255,255,255,0.9)" : "rgba(107,100,90,0.8)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = hasDarkBg ? "rgba(255,255,255,0.5)" : "rgba(107,100,90,0.4)"}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
                    <line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                </button>

                <div style={{ display: "flex", gap: "0.3rem", marginBottom: "2rem" }}>
                  {Array.from({ length: totalSteps }, (_, i) => (
                    <div key={i} style={{
                      flex: 1, height: "3px", borderRadius: "2px",
                      background: i < stepNum
                        ? "linear-gradient(90deg, #E8788A, #B8A0D2)"
                        : i === stepNum ? accentColor + "40" : hasDarkBg ? "rgba(255,255,255,0.25)" : "rgba(232,224,214,0.4)",
                      transition: "background 0.3s",
                    }} />
                  ))}
                </div>
                <div style={hasDarkBg ? { color: "white" } : {}}>
                  {children}
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function wizardBtnStyle(enabled: boolean): React.CSSProperties {
  return {
    width: "100%", padding: "0.85rem", borderRadius: "0.75rem", border: "none",
    background: enabled ? "linear-gradient(135deg, #E8788A, #B8A0D2, #8CBFD4)" : "rgba(232,224,214,0.5)",
    color: enabled ? "white" : "rgba(107,100,90,0.4)",
    fontSize: "0.95rem", fontWeight: 600, cursor: enabled ? "pointer" : "not-allowed",
    transition: "all 0.3s",
  };
}

// --- Commute Connector between itinerary stops ---

function getStopQuery(stop: ItineraryStop, fallback: string): string {
  if (stop.place?.address) return stop.place.name + " " + stop.place.address;
  if (stop.place?.name) return stop.place.name + " " + fallback;
  if (stop.customName) return stop.customName + " " + fallback;
  return fallback;
}

function estimateMinutes(fromTime?: string, toTime?: string): number | null {
  if (!fromTime || !toTime) return null;
  const [fH, fM] = fromTime.split(":").map(Number);
  const [tH, tM] = toTime.split(":").map(Number);
  const diff = (tH * 60 + tM) - (fH * 60 + fM);
  return diff > 0 ? diff : null;
}

function CommuteConnector({ from, to, fallbackLocation, eventColor }: {
  from: ItineraryStop;
  to: ItineraryStop;
  fallbackLocation: string;
  eventColor: string;
}) {
  const fromQ = encodeURIComponent(getStopQuery(from, fallbackLocation));
  const toQ = encodeURIComponent(getStopQuery(to, fallbackLocation));

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${fromQ}&destination=${toQ}&travelmode=driving`;
  const transitUrl = `https://www.google.com/maps/dir/?api=1&origin=${fromQ}&destination=${toQ}&travelmode=transit`;
  const walkUrl = `https://www.google.com/maps/dir/?api=1&origin=${fromQ}&destination=${toQ}&travelmode=walking`;
  const lyftUrl = `https://ride.lyft.com/ridetype?origin=${fromQ}&destination=${toQ}`;
  const uberUrl = `https://m.uber.com/ul/?action=setPickup&pickup=${fromQ}&dropoff=${toQ}`;

  const gap = estimateMinutes(from.time, to.time);

  const linkStyle: React.CSSProperties = {
    fontSize: "0.6rem", color: "rgba(107,100,90,0.65)", textDecoration: "none",
    padding: "0.2rem 0.4rem", borderRadius: "0.35rem",
    background: "rgba(45,42,38,0.04)", display: "inline-flex", alignItems: "center", gap: "0.2rem",
    transition: "background 0.15s",
  };

  return (
    <div style={{ display: "flex", alignItems: "stretch", gap: "0.5rem", padding: "0.25rem 0", marginLeft: "0.5rem" }}>
      {/* Vertical dashed line */}
      <div style={{ width: "1.8rem", display: "flex", justifyContent: "center", flexShrink: 0 }}>
        <div style={{ borderLeft: `2px dashed ${eventColor}25`, height: "100%" }} />
      </div>

      {/* Commute options card */}
      <div style={{
        flex: 1, background: "rgba(45,42,38,0.02)", borderRadius: "0.5rem",
        padding: "0.35rem 0.5rem", border: `1px solid ${eventColor}10`,
      }}>
        {gap && (
          <div style={{ fontSize: "0.6rem", color: "rgba(107,100,90,0.45)", marginBottom: "0.2rem" }}>
            {gap} min between stops
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
            {/* Car SVG */}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h8l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2M5 17v1a1 1 0 001 1h1a1 1 0 001-1v-1m8 0v1a1 1 0 001 1h1a1 1 0 001-1v-1"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/></svg>
            Drive
          </a>
          <a href={transitUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
            {/* Transit SVG */}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 10h16M9 21l-2-4m8 4l2-4"/><circle cx="8.5" cy="14" r="1"/><circle cx="15.5" cy="14" r="1"/></svg>
            Transit
          </a>
          <a href={walkUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
            {/* Walk SVG */}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="4" r="1.5"/><path d="M9 21l1.5-6L14 12l-1-5-3 1-1.5 3M14 12l3 9"/></svg>
            Walk
          </a>
          <a href={lyftUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
            {/* Lyft */}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12a3 3 0 006 0v-1M6 3v12a3 3 0 006 0"/></svg>
            Lyft
          </a>
          <a href={uberUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
            {/* Uber */}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/><path d="M8 12V8h2v4a2 2 0 004 0V8h2v4a4 4 0 01-8 0z"/></svg>
            Uber
          </a>
        </div>
      </div>
    </div>
  );
}

// --- Category Row with search + distance ---

function CategoryRow({
  cat,
  stops,
  eventColor,
  locationFull,
  onAdd,
}: {
  cat: SuggestionCategory;
  stops: ItineraryStop[];
  eventColor: string;
  locationFull: string;
  onAdd: (place: PlaceResult) => void;
}) {
  const [catSearch, setCatSearch] = useState("");
  const [expanded, setExpanded] = useState(false);
  const { results: searchResults, searching, search, clear } = usePlaceSearch();
  const basePlaces = catSearch.trim().length >= 2 && searchResults.length > 0 ? searchResults : cat.places;
  const INITIAL_COUNT = 4;
  const allPlaces = expanded ? basePlaces : basePlaces.slice(0, INITIAL_COUNT);
  const hasMore = basePlaces.length > INITIAL_COUNT;

  const handleCatSearch = (q: string) => {
    setCatSearch(q);
    if (q.trim().length >= 2) search(q, locationFull);
    else clear();
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
        <p style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.7)", fontWeight: 500, margin: 0 }}>
          <Icon name={cat.icon} size={16} /> {cat.category}
        </p>
        <input
          type="text"
          value={catSearch}
          onChange={(e) => handleCatSearch(e.target.value)}
          placeholder={`Search ${cat.category.toLowerCase()}...`}
          style={{
            flex: 1, maxWidth: "12rem", padding: "0.2rem 0.5rem", borderRadius: "0.375rem",
            background: "rgba(45,42,38,0.03)", border: "1px solid rgba(232,224,214,0.4)",
            color: "#2D2A26", fontSize: "0.6rem", outline: "none",
          }}
        />
        {searching && <span style={{ fontSize: "0.55rem", color: "rgba(107,100,90,0.4)" }}>Searching...</span>}
      </div>
      <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
        {allPlaces.map((place) => {
          const alreadyAdded = stops.some((s) => s.place?.entity_id === place.entity_id);
          return (
            <button
              key={place.entity_id}
              onClick={() => !alreadyAdded && onAdd(place)}
              disabled={alreadyAdded}
              style={{
                flexShrink: 0, width: "9rem", borderRadius: "0.75rem",
                background: "rgba(45,42,38,0.02)",
                border: `1px solid ${alreadyAdded ? eventColor + "30" : "rgba(232,224,214,0.5)"}`,
                cursor: alreadyAdded ? "default" : "pointer", textAlign: "left",
                padding: 0, overflow: "hidden", transition: "all 0.15s",
                opacity: alreadyAdded ? 0.5 : 1,
              }}
              onMouseOver={(e) => { if (!alreadyAdded) { e.currentTarget.style.borderColor = `${eventColor}40`; e.currentTarget.style.background = `${eventColor}08`; }}}
              onMouseOut={(e) => { if (!alreadyAdded) { e.currentTarget.style.borderColor = "rgba(232,224,214,0.5)"; e.currentTarget.style.background = "rgba(45,42,38,0.02)"; }}}
            >
              {place.imageUrl ? (
                <img src={place.imageUrl} alt="" style={{ width: "100%", height: "4.5rem", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "4.5rem", background: `${eventColor}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                  <Icon name={cat.icon} size={18} />
                </div>
              )}
              <div style={{ padding: "0.5rem" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#2D2A26", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {place.name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.125rem" }}>
                  {place.distanceMi !== undefined && (
                    <span style={{ fontSize: "0.55rem", color: "rgba(107,100,90,0.6)", fontWeight: 600 }}>
                      {place.distanceMi < 0.1 ? "< 0.1" : place.distanceMi} mi
                    </span>
                  )}
                  {place.distanceMi !== undefined && place.affinity && (
                    <span style={{ fontSize: "0.4rem", color: "rgba(107,100,90,0.3)" }}>|</span>
                  )}
                  {place.affinity && (
                    <span style={{ fontSize: "0.55rem", color: `${eventColor}99` }}>
                      {place.affinity}% match
                    </span>
                  )}
                </div>
                {place.address && (
                  <div style={{ fontSize: "0.55rem", color: "rgba(107,100,90,0.4)", marginTop: "0.125rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {typeof place.address === "string" ? place.address : ""}
                  </div>
                )}
                <div style={{ fontSize: "0.6rem", color: alreadyAdded ? eventColor : "rgba(107,100,90,0.5)", marginTop: "0.25rem", fontWeight: 500 }}>
                  {alreadyAdded ? "\u2713 Added" : "+ Add to itinerary"}
                </div>
              </div>
            </button>
          );
        })}
        {allPlaces.length === 0 && catSearch.trim().length >= 2 && !searching && (
          <div style={{ padding: "0.5rem", fontSize: "0.7rem", color: "rgba(107,100,90,0.4)" }}>
            No results in this area
          </div>
        )}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: "0.6rem", color: "rgba(107,100,90,0.6)", fontWeight: 600,
            padding: "0.3rem 0", marginTop: "0.2rem",
          }}
        >
          {expanded ? "See less" : `See more (${basePlaces.length - INITIAL_COUNT}+)`}
        </button>
      )}
    </div>
  );
}

// --- Main Page ---

export default function PlanPage() {
  const [step, setStep] = useState<"origin" | "plan-location" | "event-type" | "timing" | "vibe-choice" | "build" | "preview">("origin");
  const [eventType, setEventType] = useState("");
  const [eventLabel, setEventLabel] = useState("");
  const [homeCountry, setHomeCountry] = useState("");
  const [eventCountry, setEventCountry] = useState("");
  const [eventState, setEventState] = useState("");
  const [eventCity, setEventCity] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [zipError, setZipError] = useState("");
  const [zipValid, setZipValid] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  // Derived location string for downstream usage
  const countryName = COUNTRY_OPTIONS.find((c) => c.value === eventCountry)?.label || "";
  const location = [eventCity, eventState].filter(Boolean).join(", ");
  // Zipcode-first location for Qloo: most precise geocoding signal
  const locationFull = [zipcode, eventCity, eventState, countryName].filter(Boolean).join(", ");
  const noPostalCode = eventCountry ? !countryUsesPostalCode(eventCountry) : false;
  const locationVerified = !!(eventCountry && (eventCity || eventState) && (noPostalCode || zipValid));
  const [stops, setStops] = useState<ItineraryStop[]>([]);
  const [timeOfDay, setTimeOfDay] = useState("");
  const [dateVibe, setDateVibe] = useState<"straight" | "gay" | "lesbian" | "">("");
  const [crewVibe, setCrewVibe] = useState<"guys" | "girls" | "mixed" | "">("");
  const [eventBg, setEventBg] = useState<string | null>(null);

  const [dietary, setDietary] = useState<string[]>([]);

  // Load orientation + dietary preferences from profile if available
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("sweetspot_profile") || "{}");
      const o = p.extras?.orientation;
      if (o && ["straight", "gay", "lesbian"].includes(o)) {
        setDateVibe(o as "straight" | "gay" | "lesbian");
      }
      const d = p.extras?.dietaryPreferences;
      if (Array.isArray(d) && d.length > 0) {
        setDietary(d);
      }
    } catch {}
  }, []);
  const [vibeSource, setVibeSource] = useState<"profile" | "fresh" | "">("");
  const [searchRadius, setSearchRadius] = useState(1); // miles
  const [suggestions, setSuggestions] = useState<SuggestionCategory[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [toast, setToast] = useState("");
  const [stopsFeedback, setStopsFeedback] = useState<Map<string, { confirmed: boolean; alternative?: string }>>(new Map());

  // Itinerary history & stop reminders
  const { saveCompletion, getFrequentEntityIds } = useItineraryHistory();
  const { activeReminder, scheduleReminders, dismissReminder, clearAllReminders } = useStopReminders();
  const { user } = useAuth();

  // Validate zipcode on change (format check + geocode)
  const zipValidateRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (!eventCountry || noPostalCode) { setZipError(""); setZipValid(noPostalCode); return; }
    if (!zipcode.trim()) { setZipError(""); setZipValid(false); return; }
    if (zipValidateRef.current) clearTimeout(zipValidateRef.current);
    zipValidateRef.current = setTimeout(async () => {
      // Layer 1: Format check
      const fmt = validateZipcodeFormat(zipcode, eventCountry);
      if (!fmt.valid) { setZipError(fmt.message); setZipValid(false); setUserCoords(null); return; }
      // Layer 2: Geocode to verify existence + get coords
      try {
        const params = new URLSearchParams({ q: `${zipcode} ${eventCity || ""} ${eventState || ""}`.trim(), limit: "3" });
        const res = await fetch(`https://photon.komoot.io/api/?${params}`);
        const data = await res.json();
        const cc = eventCountry.toUpperCase();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const match = (data.features || []).find((f: any) => (f.properties?.countrycode || "").toUpperCase() === cc);
        if (!match) {
          setZipError("Postal code not found — please double-check");
          setZipValid(false); setUserCoords(null); return;
        }
        const coords = match.geometry?.coordinates;
        if (coords) setUserCoords({ lat: coords[1], lon: coords[0] });
        // Check state mismatch
        const resolvedState = match.properties?.state || "";
        if (eventState && resolvedState) {
          const es = eventState.toLowerCase(); const rs = resolvedState.toLowerCase();
          if (!rs.includes(es) && !es.includes(rs)) {
            setZipError(`This code is in ${resolvedState}, not ${eventState}`);
            setZipValid(false); return;
          }
        }
        setZipError(""); setZipValid(true);
      } catch {
        // Network error — accept format-valid zip
        setZipError(""); setZipValid(true);
      }
    }, 400);
  }, [zipcode, eventCountry, eventState, eventCity, noPostalCode]);

  // AI ambient theme
  const { theme, loading: themeLoading, moodLabel, generateTheme } = useAmbientTheme();

  const eventConfig = EVENT_TYPES.find((e) => e.id === eventType);
  const eventColor = eventConfig?.color || "#E8788A";

  // Generate ambient theme when event type or time of day is selected
  useEffect(() => {
    if (eventType) {
      generateTheme({
        eventType,
        eventLabel: eventLabel || eventConfig?.label,
        location: location || undefined,
        timeOfDay: timeOfDay || undefined,
      });
    }
  }, [eventType, eventLabel, eventConfig?.label, location, timeOfDay, generateTheme]);

  // Fetch AI suggestions when entering build step
  const lastFetchRef = useRef("");
  const fetchSuggestions = useCallback(async () => {
    if (!locationFull.trim() || !eventType) return;
    setSuggestions([]);
    setLoadingSuggestions(true);
    const params = new URLSearchParams({ event: eventType, location: locationFull, radius: String(searchRadius) });

    // Use userCoords if available, otherwise geocode the location string
    let coords = userCoords;
    if (!coords) {
      try {
        const geoParams = new URLSearchParams({ q: locationFull, limit: "1" });
        const geoRes = await fetch(`https://photon.komoot.io/api/?${geoParams}`);
        const geoData = await geoRes.json();
        const c = geoData.features?.[0]?.geometry?.coordinates;
        if (c && c.length >= 2) coords = { lat: c[1], lon: c[0] };
      } catch {}
    }
    if (coords) { params.set("lat", String(coords.lat)); params.set("lon", String(coords.lon)); }

    if (dietary.length > 0) { params.set("dietary", dietary.join(",")); }
    // Pass frequent entity IDs from itinerary history for personalized recs
    const freqIds = getFrequentEntityIds();
    if (freqIds.length > 0) { params.set("boostEntities", freqIds.join(",")); }
    fetch(`/api/plan/suggest?${params}`)
      .then((r) => r.json())
      .then((data) => setSuggestions(data.suggestions || []))
      .catch(() => {})
      .finally(() => setLoadingSuggestions(false));
  }, [locationFull, eventType, searchRadius, userCoords, dietary, getFrequentEntityIds]);

  useEffect(() => {
    if (step !== "build" || !locationFull.trim() || !eventType) return;
    const key = `${eventType}|${locationFull}|${searchRadius}`;
    if (lastFetchRef.current === key) return;
    lastFetchRef.current = key;
    fetchSuggestions();
  }, [step, locationFull, eventType, searchRadius, fetchSuggestions]);

  const toggleDietary = (id: string) => {
    setDietary((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);
  };

  const addSuggestedPlace = (place: PlaceResult, categoryLabel: string) => {
    // Map suggestion category to a stop category
    const catMap: Record<string, string> = {
      "Romantic Restaurants": "restaurant", "Restaurants": "restaurant", "Group Dining": "restaurant",
      "Fine Dining": "restaurant", "Cafes & Eateries": "restaurant", "Cafes & Coffee": "restaurant",
      "Late Night Eats": "restaurant", "Restaurants & Eateries": "restaurant",
      "Dessert & Cafes": "restaurant", "Dessert & Bakeries": "restaurant",
      "Cocktail Bars": "drinks", "Bars & Nightlife": "drinks", "Bars & Lounges": "drinks",
      "Bars & Drinks": "drinks", "Rooftop & Cocktail Bars": "drinks",
      "Parks & Scenic": "scenic", "Parks & Nature": "scenic", "Scenic Spots": "scenic",
      "Outdoor & Parks": "scenic",
      "Theaters & Shows": "entertainment", "Live Music & Shows": "entertainment",
      "Live Music": "entertainment", "Theaters & Movies": "entertainment",
      "Theaters & Cinema": "entertainment", "Comedy & Shows": "entertainment",
      "Bowling & Arcades": "activity", "Bowling & Activities": "activity",
      "Escape Rooms & Games": "activity", "Karaoke & Games": "activity",
      "Karaoke & Fun": "activity", "Activities & Fun": "activity",
      "Sports & Rec": "activity",
      "Museums & Culture": "culture", "Museums & Galleries": "culture",
      "Bookstores & Libraries": "culture", "Markets & Shopping": "culture",
      "Clubs & Dance": "nightlife", "Venues & Clubs": "nightlife",
      "Venues & Event Spaces": "nightlife",
      "Spas & Wellness": "other",
    };
    const catId = catMap[categoryLabel] || "other";
    const cat = STOP_CATEGORIES.find((c) => c.id === catId) || STOP_CATEGORIES[STOP_CATEGORIES.length - 1];

    setStops((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        category: cat.label,
        categoryIcon: cat.icon,
        place,
      },
    ]);
    setToast(`Added ${place.name}!`);
    setTimeout(() => setToast(""), 1500);
  };

  const addStop = (categoryId: string) => {
    const cat = STOP_CATEGORIES.find((c) => c.id === categoryId);
    if (!cat) return;
    setStops((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        category: cat.label,
        categoryIcon: cat.icon,
      },
    ]);
  };

  const updateStop = useCallback((id: string, updates: Partial<ItineraryStop>) => {
    setStops((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  }, []);

  const removeStop = useCallback((id: string) => {
    setStops((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const saveToProfile = () => {
    const itinerary = {
      eventType,
      eventLabel: eventLabel || eventConfig?.label || "My Event",
      location: zipcode ? `${location} (${zipcode})` : location,
      stops: stops.map((s, i) => ({
        order: i + 1,
        category: s.category,
        name: s.place?.name || s.customName || "TBD",
        address: s.place?.address,
        imageUrl: s.place?.imageUrl,
        time: s.time,
        notes: s.notes,
      })),
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem("sweetspot_itineraries") || "[]");
    existing.unshift(itinerary);
    localStorage.setItem("sweetspot_itineraries", JSON.stringify(existing.slice(0, 10)));

    // Also save as "ideal" on profile
    const profile = JSON.parse(localStorage.getItem("sweetspot_profile") || "{}");
    profile.idealItinerary = itinerary;
    localStorage.setItem("sweetspot_profile", JSON.stringify(profile));
    // Sync to Supabase
    import("@/lib/profileSync").then(({ saveProfileEverywhere }) => saveProfileEverywhere(profile)).catch(() => {});

    setToast("Saved to your profile!");
    setTimeout(() => setToast(""), 2500);
  };

  const shareItinerary = async () => {
    const title = eventLabel || eventConfig?.label || "My Event";
    const text = `${title} in ${location}\n${stops.map((s, i) => `${i + 1}. ${s.place?.name || s.customName || "TBD"}${s.time ? ` @ ${s.time}` : ""}`).join("\n")}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `The Sweet Spot — ${title}`, text });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      setToast("Itinerary copied to clipboard!");
      setTimeout(() => setToast(""), 2500);
    }
  };

  const TOTAL_WIZARD_STEPS = 4;

  // --- Step 1: Where are you from? ---
  if (step === "origin") {
    return (
      <WizardCard stepKey={step} stepNum={0} totalSteps={TOTAL_WIZARD_STEPS} accentColor={eventColor}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{"\u{1F30D}"}</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "rgba(45,42,38,0.9)", marginBottom: "0.5rem" }}>
            Where are you from?
          </h1>
          <p style={{ fontSize: "0.85rem", color: "rgba(107,100,90,0.6)" }}>
            Please enter your country
          </p>
        </div>
        <div style={{ marginBottom: "2rem" }}>
          <SearchableSelect
            options={COUNTRY_OPTIONS}
            value={homeCountry}
            onChange={(val) => {
              setHomeCountry(val);
              if (!eventCountry) setEventCountry(val);
            }}
            placeholder="Select your country"
            accentColor="#E8788A"
          />
        </div>
        <motion.button
          whileHover={homeCountry ? { scale: 1.02 } : {}}
          whileTap={homeCountry ? { scale: 0.98 } : {}}
          onClick={() => setStep("plan-location")}
          disabled={!homeCountry}
          style={wizardBtnStyle(!!homeCountry)}
        >
          Continue
        </motion.button>
      </WizardCard>
    );
  }

  // --- Step 2: Where are you planning your event? ---
  if (step === "plan-location") {
    return (
      <WizardCard stepKey={step} stepNum={1} totalSteps={TOTAL_WIZARD_STEPS} accentColor={eventColor}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{"\u{1F4CD}"}</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "rgba(45,42,38,0.9)", marginBottom: "0.5rem" }}>
            Where are you planning your event?
          </h1>
          <p style={{ fontSize: "0.85rem", color: "rgba(107,100,90,0.6)" }}>
            We use your zip/postal code to find the best spots near you
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
          {/* Country */}
          <div>
            <label style={{ fontSize: "0.65rem", color: "rgba(107,100,90,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.35rem" }}>
              Country
            </label>
            <SearchableSelect
              options={COUNTRY_OPTIONS}
              value={eventCountry}
              onChange={(val) => { setEventCountry(val); setEventState(""); setEventCity(""); setZipcode(""); }}
              placeholder="Select country"
              accentColor="#E8788A"
            />
          </div>

          {/* State / Region */}
          {eventCountry && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <label style={{ fontSize: "0.65rem", color: "rgba(107,100,90,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.35rem" }}>
                State / Region / Province
              </label>
              {hasStaticData(eventCountry) ? (
                <LocalAutocomplete
                  value={eventState}
                  onChange={(val) => { setEventState(val); setEventCity(""); }}
                  placeholder="e.g. California, Maharashtra, Ontario..."
                  accentColor="#E8788A"
                  options={(STATES[eventCountry.toLowerCase()] || []).map((s) => ({
                    label: s.name,
                    sublabel: s.abbr || "",
                    value: s.abbr || s.name,
                  }))}
                />
              ) : (
                <PhotonAutocomplete
                  value={eventState}
                  onChange={(val) => { setEventState(val); setEventCity(""); }}
                  placeholder="e.g. Ontario, Bavaria, Maharashtra..."
                  countryCode={eventCountry}
                  accentColor="#E8788A"
                  placeType="state"
                />
              )}
            </motion.div>
          )}

          {/* City — show once country is selected (state is helpful but not required) */}
          {eventCountry && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <label style={{ fontSize: "0.65rem", color: "rgba(107,100,90,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.35rem" }}>
                City / Town
              </label>
              {hasStaticData(eventCountry) ? (
                <LocalAutocomplete
                  value={eventCity}
                  onChange={(val) => setEventCity(val)}
                  placeholder="e.g. San Jose, Mumbai, Toronto..."
                  accentColor="#E8788A"
                  options={(() => {
                    const cc = eventCountry.toLowerCase();
                    const countryCities = CITIES[cc];
                    if (!countryCities) return [];
                    const stateLower = eventState?.toLowerCase();
                    const regions = stateLower
                      ? Object.keys(countryCities).filter((k) => k === stateLower || k === "_")
                      : Object.keys(countryCities);
                    const cities: { label: string; sublabel: string; value: string }[] = [];
                    for (const region of regions) {
                      const list = countryCities[region];
                      if (!list) continue;
                      const displayRegion = region === "_" ? "" : region;
                      for (const c of list) {
                        cities.push({ label: c, sublabel: displayRegion, value: `${c}-${region}` });
                      }
                    }
                    return cities;
                  })()}
                />
              ) : (
                <PhotonAutocomplete
                  value={eventCity}
                  onChange={(val) => setEventCity(val)}
                  placeholder="e.g. Toronto, London, Mumbai..."
                  countryCode={eventCountry}
                  accentColor="#E8788A"
                  placeType="city"
                  withinState={eventState || undefined}
                />
              )}
            </motion.div>
          )}

          {/* Zip / Postal code */}
          {eventCountry && !noPostalCode && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <label style={{ fontSize: "0.65rem", color: "rgba(107,100,90,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.35rem" }}>
                Zip / Postal Code <span style={{ color: "#E8788A" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value.replace(/[^a-zA-Z0-9\s-]/g, ""))}
                  placeholder="e.g. 10001"
                  style={{
                    width: "100%", padding: "0.65rem 0.75rem", borderRadius: "0.75rem",
                    border: `1px solid ${zipError ? "rgba(220,38,38,0.5)" : zipValid ? "rgba(34,197,94,0.5)" : "rgba(232,224,214,0.6)"}`,
                    background: "white", color: "rgba(45,42,38,0.8)",
                    fontSize: "0.85rem", outline: "none", fontFamily: "monospace",
                    boxSizing: "border-box", transition: "border-color 0.15s",
                    paddingRight: "2.5rem",
                  }}
                />
                {zipcode.trim() && (
                  <span style={{
                    position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
                    width: "1.1rem", height: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {zipValid ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="11" stroke="rgba(34,197,94,0.5)" strokeWidth="1.5" fill="rgba(34,197,94,0.06)" />
                        <path d="M7.5 12.5L10.5 15.5L16.5 9" stroke="rgba(34,197,94,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : zipError ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="11" stroke="rgba(220,38,38,0.4)" strokeWidth="1.5" fill="rgba(220,38,38,0.04)" />
                        <path d="M8.5 8.5L15.5 15.5M15.5 8.5L8.5 15.5" stroke="rgba(220,38,38,0.7)" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1.5s linear infinite" }}>
                        <circle cx="12" cy="12" r="10" stroke="rgba(107,100,90,0.15)" strokeWidth="2" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="rgba(107,100,90,0.4)" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )}
                  </span>
                )}
              </div>
              {zipError && (
                <p style={{ fontSize: "0.65rem", color: "rgba(220,38,38,0.8)", marginTop: "0.3rem" }}>
                  {zipError}
                </p>
              )}
              {zipValid && (
                <p style={{ fontSize: "0.6rem", color: "rgba(34,197,94,0.6)", marginTop: "0.25rem", fontWeight: 500 }}>
                  Postal code verified
                </p>
              )}
            </motion.div>
          )}
        </div>

        <motion.button
          whileHover={locationVerified ? { scale: 1.02 } : {}}
          whileTap={locationVerified ? { scale: 0.98 } : {}}
          onClick={() => setStep("event-type")}
          disabled={!locationVerified}
          style={wizardBtnStyle(locationVerified)}
        >
          Continue
        </motion.button>
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <button onClick={() => setStep("origin")} className="back-link"><IconBack size={14} /> Back</button>
        </div>
      </WizardCard>
    );
  }

  // --- Step 3: What kind of event? ---
  if (step === "event-type") {
    return (
      <WizardCard stepKey={step} stepNum={2} totalSteps={TOTAL_WIZARD_STEPS} accentColor={eventColor} backgroundImage={eventBg} pinkGlow={!eventBg}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          {eventType && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ marginBottom: "0.5rem" }}>
              <EventIllustration eventId={eventType} size={100} />
            </motion.div>
          )}
          <h1 style={{ fontSize: "1.75rem", fontWeight: 600, color: "white", marginBottom: "0.5rem", fontFamily: eventType ? getEventFont(eventType) : undefined }}>
            {eventType ? (eventLabel || eventConfig?.label) : "What kind of event?"}
          </h1>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
            {eventType ? "Plan your perfect event" : "Pick a category for your plan"}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "1.25rem" }}>
          {EVENT_TYPES.map((e) => (
            <button
              key={e.id}
              onClick={() => {
                setEventType(e.id); setEventLabel(e.label); setTimeOfDay("");
                if (e.id === "date-night") { setCrewVibe(""); setEventBg(null); }
                else if (e.id === "friends-hangout") { setDateVibe(""); setEventBg(null); }
                else { setDateVibe(""); setCrewVibe(""); setEventBg(getEventBackground(e.id, "")); }
              }}
              style={{
                padding: "0.75rem 0.5rem", borderRadius: "0.75rem",
                border: `1px solid ${eventType === e.id ? e.color + "60" : "rgba(255,255,255,0.25)"}`,
                background: eventType === e.id ? e.color + "25" : "rgba(255,255,255,0.08)",
                color: eventType === e.id ? "white" : "rgba(255,255,255,0.8)",
                cursor: "pointer", textAlign: "center", transition: "all 0.15s", fontSize: "0.8rem",
              }}
            >
              <div style={{ marginBottom: "0.25rem" }}><Icon name={e.icon} size={22} /></div>
              {e.label}
            </button>
          ))}
        </div>

        {/* Custom label */}
        {eventType === "custom" && (
          <div style={{ marginBottom: "1.25rem" }}>
            <input
              type="text"
              value={eventLabel}
              onChange={(e) => setEventLabel(e.target.value)}
              placeholder="Name your event (e.g. Anniversary Dinner)"
              style={{
                width: "100%", padding: "0.65rem 0.75rem", borderRadius: "0.75rem",
                background: "white", border: "1px solid rgba(232,224,214,0.6)",
                color: "#2D2A26", fontSize: "0.85rem", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        )}

        {/* Date Night — who's the date with? */}
        {eventType === "date-night" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: "1.25rem" }}>
            <label style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.5rem" }}>
              Who&apos;s the date with?
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
              {([
                { id: "straight" as const, label: "Him & Her", icon: "\u{1F46B}" },
                { id: "gay" as const, label: "Him & Him", icon: "\u{1F46C}" },
                { id: "lesbian" as const, label: "Her & Her", icon: "\u{1F46D}" },
              ]).map((v) => (
                <button
                  key={v.id}
                  onClick={() => { setDateVibe(v.id); setEventBg(getEventBackground("date-night", v.id)); }}
                  style={{
                    padding: "0.5rem 0.4rem", borderRadius: "0.75rem",
                    border: `1px solid ${dateVibe === v.id ? eventColor + "60" : "rgba(255,255,255,0.25)"}`,
                    background: dateVibe === v.id ? eventColor + "25" : "rgba(255,255,255,0.08)",
                    color: dateVibe === v.id ? "white" : "rgba(255,255,255,0.8)",
                    cursor: "pointer", textAlign: "center", transition: "all 0.15s", fontSize: "0.75rem",
                  }}
                >
                  <div style={{ marginBottom: "0.1rem" }}><Icon name={v.icon} size={20} /></div>
                  {v.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Friends Hangout — who's hanging out? */}
        {eventType === "friends-hangout" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: "1.25rem" }}>
            <label style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.5rem" }}>
              Who&apos;s hanging out?
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
              {([
                { id: "guys" as const, label: "The Boys", icon: "target" },
                { id: "girls" as const, label: "The Girls", icon: "target" },
                { id: "mixed" as const, label: "Mixed Group", icon: "target" },
              ]).map((v) => (
                <button
                  key={v.id}
                  onClick={() => { setCrewVibe(v.id); setEventBg(getEventBackground("friends-hangout", v.id)); }}
                  style={{
                    padding: "0.5rem 0.4rem", borderRadius: "0.75rem",
                    border: `1px solid ${crewVibe === v.id ? eventColor + "60" : "rgba(255,255,255,0.25)"}`,
                    background: crewVibe === v.id ? eventColor + "25" : "rgba(255,255,255,0.08)",
                    color: crewVibe === v.id ? "white" : "rgba(255,255,255,0.8)",
                    cursor: "pointer", textAlign: "center", transition: "all 0.15s", fontSize: "0.75rem",
                  }}
                >
                  <div style={{ marginBottom: "0.1rem" }}><Icon name={v.icon} size={20} /></div>
                  {v.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <motion.button
          whileHover={eventType && (eventType !== "date-night" || dateVibe) && (eventType !== "friends-hangout" || crewVibe) ? { scale: 1.02 } : {}}
          whileTap={eventType && (eventType !== "date-night" || dateVibe) && (eventType !== "friends-hangout" || crewVibe) ? { scale: 0.98 } : {}}
          onClick={() => setStep("timing")}
          disabled={!eventType || (eventType === "date-night" && !dateVibe) || (eventType === "friends-hangout" && !crewVibe)}
          style={wizardBtnStyle(!!eventType && (eventType !== "date-night" || !!dateVibe) && (eventType !== "friends-hangout" || !!crewVibe))}
        >
          Continue
        </motion.button>
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <button onClick={() => setStep("plan-location")} className="back-link"><IconBack size={14} /> Back</button>
        </div>
      </WizardCard>
    );
  }

  // --- Step 4: When? ---
  if (step === "timing") {
    const allowedTimes = EVENT_TIME_FILTER[eventType] || EVENT_TIME_FILTER.custom;
    const filteredTimes = TIME_OF_DAY.filter((t) => allowedTimes.includes(t.id));
    const canContinue = !!timeOfDay;

    return (
      <WizardCard stepKey={step} stepNum={3} totalSteps={TOTAL_WIZARD_STEPS} accentColor={eventColor} backgroundImage={eventBg} pinkGlow={!eventBg}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{"\u{1F552}"}</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "white", marginBottom: "0.5rem", fontFamily: eventType ? getEventFont(eventType) : undefined }}>
            When are you planning this?
          </h1>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
            Pick a time of day and optionally set exact dates
          </p>
        </div>

        {/* Time of day */}
        <label style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.5rem" }}>
          Part of the day
        </label>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${filteredTimes.length}, 1fr)`, gap: "0.5rem", marginBottom: "0.5rem" }}>
          {filteredTimes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeOfDay(t.id)}
              style={{
                padding: "0.6rem 0.4rem", borderRadius: "0.75rem",
                border: `1px solid ${timeOfDay === t.id ? eventColor + "60" : "rgba(255,255,255,0.25)"}`,
                background: timeOfDay === t.id ? eventColor + "25" : "rgba(255,255,255,0.08)",
                color: timeOfDay === t.id ? "white" : "rgba(255,255,255,0.8)",
                cursor: "pointer", textAlign: "center", transition: "all 0.15s", fontSize: "0.75rem",
              }}
            >
              <div style={{ marginBottom: "0.15rem" }}><Icon name={t.icon} size={18} /></div>
              {t.label}
            </button>
          ))}
        </div>
        {timeOfDay && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", marginBottom: "1.5rem", textAlign: "center" }}>
            {TIME_OF_DAY.find((t) => t.id === timeOfDay)?.hint}
          </motion.p>
        )}

        {/* Date & time pickers */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.35rem" }}>
              Start date
            </label>
            <input type="date" value={eventStartDate} onChange={(e) => { setEventStartDate(e.target.value); if (!eventEndDate) setEventEndDate(e.target.value); }}
              style={{
                width: "100%", padding: "0.55rem 0.5rem", borderRadius: "0.5rem",
                border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.12)",
                color: "white", fontSize: "0.8rem", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.35rem" }}>
              Start time
            </label>
            <input type="time" value={eventStartTime} onChange={(e) => setEventStartTime(e.target.value)}
              style={{
                width: "100%", padding: "0.55rem 0.5rem", borderRadius: "0.5rem",
                border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.12)",
                color: "white", fontSize: "0.8rem", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.35rem" }}>
              End date
            </label>
            <input type="date" value={eventEndDate} onChange={(e) => setEventEndDate(e.target.value)}
              min={eventStartDate || undefined}
              style={{
                width: "100%", padding: "0.55rem 0.5rem", borderRadius: "0.5rem",
                border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.12)",
                color: "white", fontSize: "0.8rem", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "0.35rem" }}>
              End time
            </label>
            <input type="time" value={eventEndTime} onChange={(e) => setEventEndTime(e.target.value)}
              style={{
                width: "100%", padding: "0.55rem 0.5rem", borderRadius: "0.5rem",
                border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.12)",
                color: "white", fontSize: "0.8rem", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <motion.button
          whileHover={canContinue ? { scale: 1.02 } : {}}
          whileTap={canContinue ? { scale: 0.98 } : {}}
          onClick={() => setStep("vibe-choice")}
          disabled={!canContinue}
          style={wizardBtnStyle(canContinue)}
        >
          Start Building
        </motion.button>
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <button onClick={() => setStep("event-type")} className="back-link"><IconBack size={14} /> Back</button>
        </div>
      </WizardCard>
    );
  }

  // --- Step 1.5: Vibe Choice ---
  if (step === "vibe-choice") {
    return (
      <>
        <AmbientTheme theme={theme} loading={themeLoading} backgroundImage={eventBg} />
        <Navbar />
        <div style={{ minHeight: "100vh", padding: "7rem 1.5rem 3rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ maxWidth: "28rem", width: "100%" }}>
            <GlassCard>
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <EventIllustration eventId={eventType} size={64} />
                <h2 style={{ fontSize: "1.3rem", fontWeight: 600, color: "rgba(45,42,38,0.9)", marginBottom: "0.4rem" }}>
                  How should we vibe this?
                </h2>
                <p style={{ fontSize: "0.85rem", color: "rgba(107,100,90,0.6)" }}>
                  Use your saved taste profile or take a quick fresh quiz to match your current mood
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => { setVibeSource("profile"); setStep("build"); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "1rem",
                    padding: "1rem 1.25rem", borderRadius: "0.75rem",
                    border: vibeSource === "profile" ? `2px solid ${eventColor}` : "1px solid rgba(232,224,214,0.6)",
                    background: "rgba(255,255,255,0.7)", cursor: "pointer",
                    textAlign: "left", width: "100%",
                  }}
                >
                  <span style={{ flexShrink: 0, color: "rgba(107,100,90,0.6)" }}><IconMusic size={24} /></span>
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "rgba(45,42,38,0.9)" }}>
                      Use my taste profile
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(107,100,90,0.5)", marginTop: "0.15rem" }}>
                      Plan based on your saved preferences &amp; DNA
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => { setVibeSource("fresh"); window.location.href = `/quiz?returnTo=/plan&event=${eventType}&time=${timeOfDay}&location=${encodeURIComponent(location)}`; }}
                  style={{
                    display: "flex", alignItems: "center", gap: "1rem",
                    padding: "1rem 1.25rem", borderRadius: "0.75rem",
                    border: vibeSource === "fresh" ? `2px solid ${eventColor}` : "1px solid rgba(232,224,214,0.6)",
                    background: "rgba(255,255,255,0.7)", cursor: "pointer",
                    textAlign: "left", width: "100%",
                  }}
                >
                  <span style={{ flexShrink: 0, color: eventColor }}><IconSparkle size={24} /></span>
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "rgba(45,42,38,0.9)" }}>
                      Fresh quiz for this event
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(107,100,90,0.5)", marginTop: "0.15rem" }}>
                      Quick retake to match your current mood &amp; vibe
                    </div>
                  </div>
                </motion.button>
              </div>

              <GradientButton variant="outline" onClick={() => setStep("timing")} className="w-full">
                Back
              </GradientButton>
            </GlassCard>
          </div>
        </div>
      </>
    );
  }

  // --- Step 2: Build ---
  if (step === "build") {
    return (
      <>
        <AmbientTheme theme={theme} loading={themeLoading} backgroundImage={eventBg} />
        <Navbar />
        <div style={{ minHeight: "100vh", padding: "7rem 1.5rem 3rem" }}>
          <div style={{ maxWidth: "36rem", margin: "0 auto" }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", marginBottom: "2rem", textShadow: eventBg ? "0 1px 8px rgba(0,0,0,0.5)" : "none" }}>
              <EventIllustration eventId={eventType} size={100} />
              <span style={{ fontSize: "0.7rem", color: eventBg ? "rgba(255,255,255,0.8)" : `${eventColor}99`, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: getEventFont(eventType) }}>
                {eventLabel || eventConfig?.label}
              </span>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 500, marginTop: "0.25rem", fontFamily: getEventFont(eventType), color: eventBg ? "white" : undefined }}>
                Build Your <span style={{ color: eventColor }}>Itinerary</span>
              </h1>
              <p style={{ color: eventBg ? "rgba(255,255,255,0.7)" : "rgba(107,100,90,0.6)", fontSize: "0.8rem" }}>
                {location}{zipcode ? ` (${zipcode})` : ""} — Add as many stops as you want
              </p>
            </motion.div>

            {/* AI Suggestions */}
            {(loadingSuggestions || suggestions.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: "1.5rem" }}
              >
                <GlassCard hover={false} style={{ padding: "1.25rem", position: "relative", overflow: "hidden" }}>
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                    background: `linear-gradient(90deg, ${eventColor}, ${eventColor}60)`,
                  }} />
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center" }}><IconPin size={14} /></span>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: eventColor }}>
                      Top Picks for your {eventLabel || eventConfig?.label}
                    </span>
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <span style={{ fontSize: "0.6rem", color: "rgba(107,100,90,0.5)" }}>Within</span>
                      <select
                        value={searchRadius}
                        onChange={(e) => setSearchRadius(Number(e.target.value))}
                        style={{
                          padding: "0.2rem 0.3rem", borderRadius: "0.375rem", fontSize: "0.6rem",
                          border: "1px solid rgba(232,224,214,0.5)", background: "white",
                          color: "#2D2A26", cursor: "pointer", outline: "none",
                        }}
                      >
                        <option value={1}>1 mi</option>
                        <option value={2}>2 mi</option>
                        <option value={3}>3 mi</option>
                        <option value={5}>5 mi</option>
                        <option value={10}>10 mi</option>
                        <option value={15}>15 mi</option>
                        <option value={25}>25 mi</option>
                      </select>
                    </div>
                  </div>

                  {dietary.length > 0 && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: "0.4rem",
                      padding: "0.45rem 0.7rem", marginBottom: "0.75rem",
                      borderRadius: "0.5rem", background: "rgba(138,196,160,0.1)",
                      border: "1px solid rgba(138,196,160,0.25)",
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8AC4A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                      <span style={{ fontSize: "0.65rem", color: "rgba(107,100,90,0.7)" }}>
                        Food places filtered for your dietary preferences ({dietary.map((d) => d.replace(/-/g, " ")).join(", ")})
                      </span>
                    </div>
                  )}

                  {loadingSuggestions ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0" }}>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        style={{ fontSize: "0.8rem", display: "inline-block" }}
                      >
                        ◌
                      </motion.span>
                      <span style={{ fontSize: "0.8rem", color: "rgba(107,100,90,0.6)" }}>
                        Finding great places near {location}...
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {suggestions.map((cat) => (
                        <CategoryRow
                          key={cat.category}
                          cat={cat}
                          stops={stops}
                          eventColor={eventColor}
                          locationFull={locationFull}
                          onAdd={(place) => addSuggestedPlace(place, cat.category)}
                        />
                      ))}
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )}

            {/* Stops list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <AnimatePresence>
                {stops.map((stop, i) => (
                  <StopEditor
                    key={stop.id}
                    stop={stop}
                    index={i}
                    location={locationFull}
                    onUpdate={updateStop}
                    onRemove={removeStop}
                    eventColor={eventColor}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Add stop */}
            <GlassCard hover={false} style={{ padding: "1.25rem" }}>
              <p style={{ fontSize: "0.7rem", color: "rgba(107,100,90,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>
                + Add a stop
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                {STOP_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => addStop(cat.id)}
                    style={{
                      padding: "0.4rem 0.75rem", borderRadius: "9999px",
                      background: "rgba(45,42,38,0.03)", border: "1px solid rgba(232,224,214,0.5)",
                      color: "rgba(107,100,90,0.8)", fontSize: "0.75rem", cursor: "pointer",
                      transition: "all 0.15s", display: "flex", alignItems: "center", gap: "0.25rem",
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = `${eventColor}15`; e.currentTarget.style.borderColor = `${eventColor}30`; e.currentTarget.style.color = "#2D2A26"; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = "rgba(45,42,38,0.03)"; e.currentTarget.style.borderColor = "rgba(232,224,214,0.5)"; e.currentTarget.style.color = "rgba(107,100,90,0.8)"; }}
                    title={cat.examples}
                  >
                    <Icon name={cat.icon} size={14} /> {cat.label}
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}
            >
              {/* Dietary — only when food/drink stops exist */}
              {stops.some((s) => {
                const catId = STOP_CATEGORIES.find((c) => c.label === s.category)?.id;
                return catId && FOOD_STOP_IDS.has(catId);
              }) && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "1rem" }}>
                  <GlassCard hover={false} style={{ padding: "1rem 1.25rem" }}>
                    <label style={{ fontSize: "0.65rem", color: "rgba(107,100,90,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem", display: "block" }}>
                      Dietary Preferences
                      <span style={{ fontSize: "0.55rem", color: "rgba(107,100,90,0.35)", textTransform: "none", letterSpacing: "normal", marginLeft: "0.4rem" }}>
                        since your plan includes food
                      </span>
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                      {DIETARY_OPTIONS.map((opt) => {
                        const selected = dietary.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            onClick={() => toggleDietary(opt.id)}
                            style={{
                              padding: "0.3rem 0.6rem", borderRadius: "9999px",
                              background: selected ? `${eventColor}18` : "rgba(45,42,38,0.02)",
                              border: `1px solid ${selected ? eventColor + "40" : "rgba(232,224,214,0.5)"}`,
                              color: selected ? "#2D2A26" : "rgba(107,100,90,0.7)",
                              fontSize: "0.7rem", cursor: "pointer", transition: "all 0.15s",
                              display: "flex", alignItems: "center", gap: "0.2rem",
                            }}
                          >
                            <Icon name={opt.icon} size={12} /> {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {stops.length > 0 && (() => {
                const allTimesSet = stops.every((s) => s.time);
                const missingCount = stops.filter((s) => !s.time).length;
                return (
                  <div>
                    <GradientButton
                      onClick={() => {
                        // Sort stops by time before previewing
                        const sorted = [...stops].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
                        setStops(sorted);
                        setStep("preview");
                        // Schedule stop reminders for timed stops
                        scheduleReminders(sorted.map((s) => ({
                          id: s.id,
                          placeName: s.place?.name || s.customName || s.category,
                          placeEntityId: s.place?.entity_id,
                          category: s.category,
                          time: s.time,
                        })));
                      }}
                      disabled={!allTimesSet}
                    >
                      Preview Itinerary
                    </GradientButton>
                    {!allTimesSet && (
                      <p style={{ textAlign: "center", fontSize: "0.65rem", color: "rgba(220,38,38,0.6)", marginTop: "0.35rem" }}>
                        Set a time for {missingCount === 1 ? "1 stop" : `all ${missingCount} stops`} to continue
                      </p>
                    )}
                  </div>
                );
              })()}
              <GradientButton variant="outline" onClick={() => { setSuggestions([]); setStep("timing"); }}>
                <IconBack size={14} /> Back
              </GradientButton>
            </motion.div>

            {stops.length === 0 && (
              <p style={{ textAlign: "center", color: "rgba(107,100,90,0.4)", fontSize: "0.8rem", marginTop: "0.75rem" }}>
                Pick categories above to start adding stops to your itinerary
              </p>
            )}
          </div>
        </div>
        <Toast message={toast} visible={!!toast} />
      </>
    );
  }

  // --- Step 3: Preview / Share ---
  return (
    <>
      <AmbientTheme theme={theme} loading={themeLoading} backgroundImage={eventBg} />
      <Navbar />
      <div style={{ minHeight: "100vh", padding: "7rem 1.5rem 3rem" }}>
        <div style={{ maxWidth: "36rem", margin: "0 auto" }}>
          {/* Card header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: "center", marginBottom: "2rem", textShadow: eventBg ? "0 1px 8px rgba(0,0,0,0.5)" : "none" }}
          >
            <EventIllustration eventId={eventType} size={120} />
            <h1 style={{ fontSize: "2.2rem", fontFamily: getEventFont(eventType), fontWeight: 500, marginTop: "0.5rem", color: eventBg ? "white" : undefined }}>
              {eventLabel || eventConfig?.label}
            </h1>
            <p style={{ color: eventBg ? "rgba(255,255,255,0.7)" : "rgba(107,100,90,0.6)", fontSize: "0.85rem" }}>
              {location}{zipcode ? ` (${zipcode})` : ""} · {stops.length} stop{stops.length !== 1 ? "s" : ""}
            </p>
          </motion.div>

          {/* Journey timeline */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {stops.map((stop, i) => {
              const fromQ = encodeURIComponent(getStopQuery(stop, location));
              const nextStop = stops[i + 1];
              const toQ = nextStop ? encodeURIComponent(getStopQuery(nextStop, location)) : "";
              const gap = nextStop ? estimateMinutes(stop.time, nextStop.time) : null;

              return (
                <div key={stop.id} style={{ width: "100%", maxWidth: "32rem" }}>
                  {/* Stop card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.12 }}
                    style={{
                      borderRadius: "1.25rem", overflow: "hidden", position: "relative",
                      background: "rgba(255,255,255,0.18)", backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                    }}
                  >
                    {/* Accent left strip */}
                    <div style={{
                      position: "absolute", top: 0, left: 0, bottom: 0, width: "3px",
                      background: `linear-gradient(to bottom, ${eventColor}, ${eventColor}50)`,
                      borderRadius: "3px 0 0 3px",
                    }} />

                    <div style={{ padding: "1.1rem 1.25rem 1.1rem 1.5rem" }}>
                      <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
                        {/* Image */}
                        {stop.place?.imageUrl ? (
                          <img
                            src={stop.place.imageUrl} alt={stop.place.name}
                            style={{
                              width: "3.75rem", height: "3.75rem", borderRadius: "1rem",
                              objectFit: "cover", border: "2px solid rgba(255,255,255,0.3)", flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div style={{
                            width: "3.75rem", height: "3.75rem", borderRadius: "1rem",
                            background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center",
                            justifyContent: "center", fontSize: "1.5rem", flexShrink: 0,
                          }}>
                            {stop.categoryIcon}
                          </div>
                        )}

                        {/* Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>
                              {stop.place?.name || stop.customName || "TBD"}
                            </h3>
                            {stop.time && (
                              <span style={{
                                fontSize: "0.65rem", color: "white", fontFamily: "monospace", flexShrink: 0,
                                background: "rgba(255,255,255,0.2)", padding: "0.2rem 0.55rem", borderRadius: "9999px",
                                backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)",
                              }}>
                                {stop.time}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            {stop.category}
                          </span>
                          {stop.place?.address && (
                            <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", marginTop: "0.2rem", lineHeight: 1.35 }}>
                              {stop.place.address}
                            </p>
                          )}
                          {stop.notes && (
                            <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.65)", marginTop: "0.15rem", fontStyle: "italic" }}>
                              {stop.notes}
                            </p>
                          )}
                          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.4rem" }}>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${fromQ}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.7)", textDecoration: "none" }}
                            >
                              Maps ↗
                            </a>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${fromQ}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.7)", textDecoration: "none" }}
                            >
                              Directions ↗
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Connector between stops — red dot line + side commute note */}
                  {i < stops.length - 1 && (
                    <div style={{ display: "flex", alignItems: "stretch", padding: "0 1rem", minHeight: "3.5rem" }}>
                      {/* Vertical line with dots */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "1.5rem", flexShrink: 0 }}>
                        <div style={{
                          width: "0.5rem", height: "0.5rem", borderRadius: "50%",
                          background: "#E8788A", boxShadow: "0 0 6px rgba(232,120,138,0.5)",
                        }} />
                        <div style={{ flex: 1, width: "2px", background: "linear-gradient(to bottom, #E8788A, #E8788A60)" }} />
                        <div style={{
                          width: "0.5rem", height: "0.5rem", borderRadius: "50%",
                          background: "#E8788A", boxShadow: "0 0 6px rgba(232,120,138,0.5)",
                        }} />
                      </div>

                      {/* Side sticky note — commute info */}
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.12 + 0.15 }}
                        style={{
                          marginLeft: "0.5rem", alignSelf: "center",
                          background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)",
                          borderRadius: "0.75rem", padding: "0.4rem 0.75rem",
                          border: "1px solid rgba(255,255,255,0.12)",
                          display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap",
                        }}
                      >
                        {gap && (
                          <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.6)" }}>
                            {gap} min
                          </span>
                        )}
                        {[
                          { label: "Drive", url: `https://www.google.com/maps/dir/?api=1&origin=${fromQ}&destination=${toQ}&travelmode=driving` },
                          { label: "Transit", url: `https://www.google.com/maps/dir/?api=1&origin=${fromQ}&destination=${toQ}&travelmode=transit` },
                          { label: "Walk", url: `https://www.google.com/maps/dir/?api=1&origin=${fromQ}&destination=${toQ}&travelmode=walking` },
                          { label: "Lyft", url: `https://ride.lyft.com/ridetype?origin=${fromQ}&destination=${toQ}` },
                          { label: "Uber", url: `https://m.uber.com/ul/?action=setPickup&pickup=${fromQ}&dropoff=${toQ}` },
                        ].map((l) => (
                          <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                            style={{
                              fontSize: "0.55rem", color: "rgba(255,255,255,0.55)", textDecoration: "none",
                              padding: "0.1rem 0.35rem", borderRadius: "0.3rem",
                              background: "rgba(255,255,255,0.08)", transition: "background 0.15s",
                            }}
                          >
                            {l.label}
                          </a>
                        ))}
                      </motion.div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Branding footer */}
          <div style={{ marginTop: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 0.5rem" }}>
            <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-yuyu)", color: "rgba(255,255,255,0.35)" }}>The Sweet Spot</span>
            <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.25)" }}>Powered by Qloo</span>
          </div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={shareItinerary}
              className="glass-action-btn"
            >
              Share Itinerary
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={saveToProfile}
              className="glass-action-btn"
            >
              Save to Profile
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep("build")}
              className="glass-action-btn"
            >
              <IconBack size={14} /> Back to Edit
            </motion.button>
          </motion.div>

          {/* Finish & Save itinerary for future recommendations */}
          {user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ textAlign: "center", marginTop: "1.5rem" }}
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={async () => {
                  const feedback = stops.map((s) => {
                    const fb = stopsFeedback.get(s.id);
                    return {
                      stopId: s.id,
                      placeName: s.place?.name || s.customName || s.category,
                      placeEntityId: s.place?.entity_id,
                      category: s.category,
                      confirmed: fb?.confirmed ?? true,
                      alternativePlace: fb?.alternative,
                    };
                  });
                  await saveCompletion({
                    eventType,
                    location: locationFull,
                    itinerary: stops,
                    stopsFeedback: feedback,
                  });
                  clearAllReminders();
                  setToast("Itinerary saved! Your future recommendations will be even better.");
                }}
                style={{
                  padding: "0.65rem 1.5rem", borderRadius: "0.75rem", border: "none",
                  background: "linear-gradient(135deg, #8AC4A0, #8CBFD4)", color: "white",
                  fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(138,196,160,0.3)",
                }}
              >
                Finish & Save for Recommendations
              </motion.button>
            </motion.div>
          )}

          <p style={{ textAlign: "center", color: "rgba(107,100,90,0.35)", fontSize: "0.7rem", marginTop: "1rem" }}>
            This itinerary will appear on your profile as &quot;My ideal {(eventLabel || eventConfig?.label || "event").toLowerCase()}&quot;
          </p>
        </div>
      </div>

      {/* Stop reminder prompt overlay */}
      <AnimatePresence>
        {activeReminder && (
          <StopReminderPrompt
            stop={activeReminder}
            onConfirm={(stopId, confirmed, alternative) => {
              setStopsFeedback((prev) => {
                const next = new Map(prev);
                next.set(stopId, { confirmed, alternative: alternative?.name });
                return next;
              });
            }}
            onDismiss={dismissReminder}
          />
        )}
      </AnimatePresence>

      <Toast message={toast} visible={!!toast} />
    </>
  );
}
