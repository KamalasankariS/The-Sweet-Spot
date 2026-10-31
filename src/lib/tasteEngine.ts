/**
 * Taste Personality Engine v2
 *
 * Maps quiz selections to personality dimensions via PATTERN recognition
 * across all selections — not 1:1 trait mapping.
 *
 * Dimensions (refined per feedback):
 *   expressiveness  — bold/outgoing vs. reserved/understated
 *   sophistication  — refined/curated vs. casual/accessible
 *   adventurousness — explorer/risk-taker vs. comfort-seeker
 *   warmth          — intimate/connected vs. cool/independent
 *   energy          — high-octane/social vs. calm/introspective
 *   nostalgia       — retro/classic-leaning vs. forward-looking
 *
 * The deterministic backbone (archetype + scores + traits) is stable
 * for the same selections. LLM-generated descriptions add freshness.
 */

// --- Personality Dimensions ---

export interface PersonalityScores {
  expressiveness: number;
  sophistication: number;
  adventurousness: number;
  warmth: number;
  energy: number;
  nostalgia: number;
}

const ZERO_SCORES: PersonalityScores = {
  expressiveness: 0,
  sophistication: 0,
  adventurousness: 0,
  warmth: 0,
  energy: 0,
  nostalgia: 0,
};

// --- Selection → Personality Signal Maps ---
// Each selection contributes partial scores. Patterns emerge when
// multiple selections reinforce the same dimensions.

const MUSIC_SIGNALS: Record<string, Partial<PersonalityScores>> = {
  "Radiohead":        { sophistication: 2, energy: -1, nostalgia: 1, expressiveness: 1 },
  "Beyonce":          { expressiveness: 2, energy: 2, warmth: 1, sophistication: 1 },
  "Kendrick Lamar":   { expressiveness: 2, sophistication: 2, adventurousness: 1, energy: 1 },
  "Taylor Swift":     { warmth: 2, expressiveness: 1, energy: 1, nostalgia: 1 },
  "The Weeknd":       { energy: 1, sophistication: 1, expressiveness: 1, warmth: -1 },
  "Daft Punk":        { energy: 2, adventurousness: 1, nostalgia: 1, expressiveness: 1 },
  "Arctic Monkeys":   { sophistication: 1, expressiveness: 1, nostalgia: 1, adventurousness: 0 },
  "Frank Ocean":      { sophistication: 2, warmth: 1, expressiveness: 1, energy: -1 },
  "Bad Bunny":        { energy: 2, expressiveness: 2, adventurousness: 1, warmth: 1 },
  "Tame Impala":      { adventurousness: 2, sophistication: 1, nostalgia: 1, expressiveness: 0 },
  "SZA":              { warmth: 2, expressiveness: 1, sophistication: 1, energy: 0 },
  "Tyler the Creator":{ adventurousness: 2, expressiveness: 2, sophistication: 1, energy: 1 },
};

const MOVIES_SIGNALS: Record<string, Partial<PersonalityScores>> = {
  "Inception":             { sophistication: 1, energy: 1, adventurousness: 1, expressiveness: 0 },
  "Breaking Bad":          { sophistication: 1, energy: 1, expressiveness: 0, warmth: -1 },
  "Parasite":              { sophistication: 2, adventurousness: 2, expressiveness: 1, warmth: -1 },
  "The Office":            { warmth: 2, expressiveness: 1, nostalgia: 1, energy: 0 },
  "Interstellar":          { sophistication: 2, warmth: 1, adventurousness: 1, energy: 0 },
  "Succession":            { sophistication: 2, expressiveness: 1, warmth: -2, energy: 1 },
  "Everything Everywhere": { adventurousness: 2, warmth: 2, expressiveness: 2, energy: 2 },
  "Stranger Things":       { nostalgia: 2, warmth: 1, energy: 1, expressiveness: 1 },
  "Pulp Fiction":          { expressiveness: 2, energy: 2, nostalgia: 2, adventurousness: 1 },
  "Ted Lasso":             { warmth: 2, expressiveness: 1, energy: 1, sophistication: 0 },
  "Spirited Away":         { sophistication: 2, warmth: 2, adventurousness: 1, nostalgia: 1 },
  "The Bear":              { energy: 2, sophistication: 1, warmth: 1, expressiveness: 1 },
};

const DINING_SIGNALS: Record<string, Partial<PersonalityScores>> = {
  "Japanese":      { sophistication: 2, adventurousness: 1, energy: -1, expressiveness: 0 },
  "Italian":       { warmth: 2, nostalgia: 1, expressiveness: 1, sophistication: 1 },
  "Mexican":       { warmth: 2, energy: 1, expressiveness: 1, adventurousness: 0 },
  "Thai":          { adventurousness: 1, energy: 1, sophistication: 1, warmth: 1 },
  "Korean BBQ":    { energy: 2, warmth: 2, adventurousness: 1, expressiveness: 1 },
  "Farm-to-table": { sophistication: 2, warmth: 1, adventurousness: 1, expressiveness: 0 },
  "Sushi":         { sophistication: 2, expressiveness: 0, energy: -1, adventurousness: 0 },
  "Ramen":         { warmth: 2, nostalgia: 1, energy: 0, expressiveness: 0 },
  "Mediterranean": { warmth: 1, sophistication: 1, adventurousness: 1, expressiveness: 0 },
  "Indian":        { adventurousness: 1, warmth: 2, expressiveness: 1, energy: 1 },
  "French bistro": { sophistication: 2, nostalgia: 1, warmth: 1, expressiveness: 1 },
  "Street food":   { adventurousness: 2, energy: 2, expressiveness: 1, warmth: 1 },
};

const NIGHTLIFE_SIGNALS: Record<string, Partial<PersonalityScores>> = {
  "Cocktail bars":  { sophistication: 2, expressiveness: 1, energy: 0, warmth: 0 },
  "Live music":     { energy: 2, expressiveness: 1, warmth: 1, adventurousness: 1 },
  "Jazz clubs":     { sophistication: 2, nostalgia: 2, warmth: 1, expressiveness: 0 },
  "Rooftop bars":   { expressiveness: 1, sophistication: 1, energy: 1, warmth: 0 },
  "Dive bars":      { warmth: 1, adventurousness: 1, nostalgia: 1, expressiveness: 0 },
  "Dance clubs":    { energy: 2, expressiveness: 2, warmth: -1, adventurousness: 0 },
  "Wine bars":      { sophistication: 2, warmth: 1, energy: -1, nostalgia: 1 },
  "Comedy shows":   { warmth: 2, energy: 1, expressiveness: 1, adventurousness: 0 },
  "Speakeasy":      { sophistication: 2, nostalgia: 2, adventurousness: 1, expressiveness: 1 },
  "Karaoke":        { expressiveness: 2, energy: 2, warmth: 2, nostalgia: 1 },
  "Beer gardens":   { warmth: 2, energy: 1, expressiveness: 1, nostalgia: 0 },
  "Art galleries":  { sophistication: 2, adventurousness: 1, energy: -1, expressiveness: 1 },
};

const STYLE_SIGNALS: Record<string, Partial<PersonalityScores>> = {
  "Nike":          { energy: 2, expressiveness: 1, warmth: 0, adventurousness: 0 },
  "Aesop":         { sophistication: 2, warmth: 1, expressiveness: 0, adventurousness: 0 },
  "Patagonia":     { warmth: 2, adventurousness: 2, expressiveness: 0, nostalgia: 0 },
  "Apple":         { sophistication: 1, expressiveness: 0, energy: 0, warmth: -1 },
  "Supreme":       { expressiveness: 2, adventurousness: 1, energy: 1, warmth: -1 },
  "Muji":          { sophistication: 2, warmth: 1, energy: -2, expressiveness: -1 },
  "Vintage":       { nostalgia: 2, adventurousness: 1, expressiveness: 1, sophistication: 1 },
  "Minimalist":    { sophistication: 2, energy: -2, expressiveness: -1, warmth: 0 },
  "Streetwear":    { expressiveness: 2, energy: 2, adventurousness: 1, nostalgia: 0 },
  "Cottagecore":   { warmth: 2, nostalgia: 2, energy: -1, expressiveness: 1 },
  "Y2K":           { nostalgia: 2, expressiveness: 2, energy: 2, adventurousness: 1 },
  "Scandinavian":  { sophistication: 2, warmth: 1, energy: -1, expressiveness: 0 },
};

const SIGNAL_MAPS = [MUSIC_SIGNALS, MOVIES_SIGNALS, DINING_SIGNALS, NIGHTLIFE_SIGNALS, STYLE_SIGNALS];

// --- Hash-based scoring for unknown selections ---
// Ensures custom-typed entries still produce unique personality signals

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function syntheticSignal(item: string, categoryIndex: number): Partial<PersonalityScores> {
  const h = hashString(item.toLowerCase().trim() + categoryIndex);
  const dims: (keyof PersonalityScores)[] = [
    "expressiveness", "sophistication", "adventurousness", "warmth", "energy", "nostalgia"
  ];
  const signal: Partial<PersonalityScores> = {};
  for (let i = 0; i < dims.length; i++) {
    // Each dimension gets a value from -1 to 2 based on hash bits
    const bits = (h >> (i * 4)) & 0xf;
    signal[dims[i]] = bits < 4 ? -1 : bits < 8 ? 0 : bits < 12 ? 1 : 2;
  }
  return signal;
}

// --- Archetypes ---
// Matched via pattern scoring, not single-trait mapping

export interface Archetype {
  name: string;
  emoji: string;
  match: (scores: PersonalityScores) => number;
}

const ARCHETYPES: Archetype[] = [
  {
    name: "The Curator",
    emoji: "target",
    match: (s) => s.sophistication * 2.5 + s.adventurousness - s.expressiveness * 0.5,
  },
  {
    name: "The Nighthawk",
    emoji: "crystal",
    match: (s) => s.energy * 2 + s.adventurousness + s.expressiveness - s.warmth,
  },
  {
    name: "The Connector",
    emoji: "heart",
    match: (s) => s.warmth * 2.5 + s.expressiveness + s.energy * 0.5,
  },
  {
    name: "The Deep Cut",
    emoji: "sparkle",
    match: (s) => s.sophistication * 2 + s.adventurousness * 1.5 - s.energy,
  },
  {
    name: "The Nostalgist",
    emoji: "music",
    match: (s) => s.nostalgia * 2.5 + s.warmth + s.sophistication * 0.5,
  },
  {
    name: "The Explorer",
    emoji: "map",
    match: (s) => s.adventurousness * 2.5 + s.energy + s.expressiveness * 0.5 - s.nostalgia,
  },
  {
    name: "The Vibe Architect",
    emoji: "palette",
    match: (s) => s.sophistication * 1.5 + s.expressiveness * 1.5 + s.adventurousness - s.warmth * 0.5,
  },
  {
    name: "The Main Character",
    emoji: "star",
    match: (s) => s.expressiveness * 2.5 + s.energy * 1.5 + s.warmth * 0.5,
  },
  {
    name: "The Minimalist",
    emoji: "coffee",
    match: (s) => s.sophistication * 2 - s.energy * 1.5 - s.expressiveness + s.warmth * 0.5,
  },
  {
    name: "The Wildcard",
    emoji: "magic",
    match: (s) => {
      const vals = Object.values(s);
      const range = Math.max(...vals) - Math.min(...vals);
      return s.adventurousness * 1.5 + range * 0.8 + s.expressiveness;
    },
  },
];

// --- Trait Labels ---

const TRAIT_LABELS: Record<keyof PersonalityScores, string> = {
  expressiveness: "Expressive",
  sophistication: "Refined",
  adventurousness: "Adventurous",
  warmth: "Warm",
  energy: "High-energy",
  nostalgia: "Nostalgic",
};

// --- Core Computation ---

function aggregateScores(
  selections: string[],
  signalMap: Record<string, Partial<PersonalityScores>>,
  categoryIndex: number = 0
): PersonalityScores {
  const total = { ...ZERO_SCORES };
  for (const item of selections) {
    // Use predefined signal if available, otherwise generate from hash
    const signals = signalMap[item] || syntheticSignal(item, categoryIndex);
    for (const [key, val] of Object.entries(signals)) {
      total[key as keyof PersonalityScores] += val as number;
    }
  }
  return total;
}

function computeFullProfile(selections: Record<number, string[]>): PersonalityScores {
  const total = { ...ZERO_SCORES };
  for (let i = 0; i < SIGNAL_MAPS.length; i++) {
    const items = selections[i] || [];
    const catScores = aggregateScores(items, SIGNAL_MAPS[i], i);
    for (const key of Object.keys(total) as (keyof PersonalityScores)[]) {
      total[key] += catScores[key];
    }
  }
  return total;
}

function getTopTraits(scores: PersonalityScores, count: number = 3): { trait: string; value: number }[] {
  return Object.entries(scores)
    .map(([key, val]) => ({ trait: TRAIT_LABELS[key as keyof PersonalityScores], value: val }))
    .sort((a, b) => b.value - a.value)
    .slice(0, count);
}

function findArchetype(scores: PersonalityScores): Archetype {
  let best = ARCHETYPES[0];
  let bestScore = -Infinity;
  for (const arch of ARCHETYPES) {
    const score = arch.match(scores);
    if (score > bestScore) {
      bestScore = score;
      best = arch;
    }
  }
  return best;
}

// --- Deterministic Fallback Descriptions ---
// Used when LLM is unavailable. Better than before but still static.

function getFallbackCategoryInsight(catIndex: number, selections: string[], scores: PersonalityScores): string {
  if (selections.length === 0) return "Unexplored";

  const labels: Record<number, Record<string, string>> = {
    0: { // Music
      expressiveness: "Bold & expressive",
      sophistication: "Sonic perfectionist",
      adventurousness: "Genre-defying ear",
      warmth: "Lyrics-first listener",
      energy: "Festival-ready soul",
      nostalgia: "Vinyl collector heart",
    },
    1: { // Film
      expressiveness: "Watches with their whole chest",
      sophistication: "Arthouse mind",
      adventurousness: "Will watch anything once",
      warmth: "Heart & humor",
      energy: "Binge-mode activated",
      nostalgia: "Classics-first cinephile",
    },
    2: { // Dining
      expressiveness: "Eats with enthusiasm",
      sophistication: "Reservation connoisseur",
      adventurousness: "Fearless palate",
      warmth: "Communal table lover",
      energy: "Food adventure seeker",
      nostalgia: "Comfort food devotee",
    },
    3: { // Nightlife
      expressiveness: "Center of the room",
      sophistication: "Ambiance-first",
      adventurousness: "Off-the-map nighthawk",
      warmth: "Neighborhood regular",
      energy: "Last one standing",
      nostalgia: "Old-school night owl",
    },
    4: { // Style
      expressiveness: "Wears personality loudly",
      sophistication: "Quiet luxury",
      adventurousness: "Style risk-taker",
      warmth: "Earthy & intentional",
      energy: "Streetwear pulse",
      nostalgia: "Retro soul",
    },
  };

  // Find dominant dimension for this category
  const catScores = aggregateScores(selections, SIGNAL_MAPS[catIndex], catIndex);
  const dominant = Object.entries(catScores)
    .sort(([, a], [, b]) => b - a)[0][0] as keyof PersonalityScores;

  return labels[catIndex]?.[dominant] || "Unique taste";
}

function getFallbackArchetypeDescription(archetype: Archetype, scores: PersonalityScores, selections: Record<number, string[]>): string {
  // Pick a few selections to reference for personalization
  const allPicks = Object.values(selections).flat();
  const highlights = allPicks.slice(0, 3).join(", ");
  const pickCount = allPicks.length;

  const descs: Record<string, (h: string, n: number) => string> = {
    "The Curator": (h) => `Every recommendation you make is gold — from ${h} onward. Your taste is intentional, refined, and always a step ahead.`,
    "The Nighthawk": (h) => `You come alive after dark. ${h} are just the warm-up — high energy, always chasing the next experience.`,
    "The Connector": (h) => `You bring people together. Whether it's ${h}, you pick spots where everyone belongs.`,
    "The Deep Cut": (h) => `While others skim the surface, you go deep. ${h} — your picks are niche, intentional, and surprisingly on point.`,
    "The Nostalgist": (h) => `You find beauty in what endures. ${h} reveal an old soul with emotional depth — classic taste at its finest.`,
    "The Explorer": (h) => `Routine bores you. ${h} are just the beginning — you're first to try the new spot, the fusion menu, the underground show.`,
    "The Vibe Architect": (h) => `You don't just pick places — you design experiences. ${h} set the tone for a world you've carefully curated.`,
    "The Main Character": (h, n) => `Bold, expressive, unapologetically yourself. From ${h} to everything else — ${n} picks that radiate main-character energy.`,
    "The Minimalist": (h) => `Quality over quantity. ${h} — each pick is intentional. You don't need the hype, just the right moment.`,
    "The Wildcard": (h) => `Your taste defies labels. ${h} in the same profile? Only you could make it all make sense.`,
  };
  const fn = descs[archetype.name];
  return fn ? fn(highlights, pickCount) : `Your ${pickCount} picks tell a story only you could write.`;
}

function getFallbackTagline(archetype: Archetype): string {
  const tags: Record<string, string> = {
    "The Curator": "Refined taste, zero pretension",
    "The Nighthawk": "Lives for the after-hours magic",
    "The Connector": "Socially magnetic, emotionally tuned-in",
    "The Deep Cut": "If you know, you know",
    "The Nostalgist": "Old soul, timeless taste",
    "The Explorer": "Always chasing the next discovery",
    "The Vibe Architect": "Every night out is a mood board",
    "The Main Character": "Main-character energy, impeccable taste",
    "The Minimalist": "Less noise, more intention",
    "The Wildcard": "Unpredictable in the best way",
  };
  return tags[archetype.name] || "One of a kind";
}

function getFallbackAesthetic(scores: PersonalityScores): string {
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const top1 = sorted[0][0] as keyof PersonalityScores;
  const top2 = sorted[1][0] as keyof PersonalityScores;

  const combos: Record<string, Record<string, string>> = {
    expressiveness: {
      sophistication: "Gallery openings with a champagne toast",
      adventurousness: "Says yes before you finish asking",
      warmth: "The life of the party with a soft spot for deep talks",
      energy: "Main-character energy, golden-retriever heart",
      nostalgia: "Retro vibes, bold choices",
    },
    sophistication: {
      expressiveness: "Effortlessly stylish, always interesting",
      adventurousness: "First to find the unmarked door",
      warmth: "Candlelit conversations over craft cocktails",
      energy: "Polished taste that never sits still",
      nostalgia: "Old world charm, new world edge",
    },
    adventurousness: {
      expressiveness: "Fearless taste, magnetic presence",
      sophistication: "Taste that keeps people guessing",
      warmth: "Drags friends to the best spots they'd never find alone",
      energy: "Won't stop till the sun comes up",
      nostalgia: "Vintage hunter, thrift store legend",
    },
    warmth: {
      expressiveness: "Brings the group, keeps the group",
      sophistication: "Intimate dinners with curated playlists",
      adventurousness: "Comfort zone? Never heard of it",
      energy: "Everyone's favorite plus-one",
      nostalgia: "Home is wherever the good people are",
    },
    energy: {
      expressiveness: "Center of every room, every time",
      sophistication: "Refined taste with relentless momentum",
      adventurousness: "Adventure on tap, energy to spare",
      warmth: "High-energy with a heart of gold",
      nostalgia: "Throwback nights hit different with you",
    },
    nostalgia: {
      expressiveness: "Vintage soul with a bold streak",
      sophistication: "Timeless in a world of trends",
      adventurousness: "Digging through crates for gold",
      warmth: "Old favorites, new memories",
      energy: "Classic taste, current energy",
    },
  };

  return combos[top1]?.[top2] || "A taste profile that defies description";
}

// --- Public API ---

export interface CategoryInsight {
  label: string;
  color: string;
}

const CATEGORY_COLORS = ["#f97316", "#ec4899", "#8b5cf6", "#06b6d4", "#84cc16"];

export interface TasteAnalysis {
  archetype: {
    name: string;
    emoji: string;
    tagline: string;
    description: string;
  };
  scores: PersonalityScores;
  topTraits: { trait: string; value: number }[];
  aesthetic: string;
  categoryInsights: {
    music: CategoryInsight;
    film: CategoryInsight;
    dining: CategoryInsight;
    nightlife: CategoryInsight;
    style: CategoryInsight;
  };
  // Raw data for LLM prompt construction
  rawSelections: Record<number, string[]>;
}

export function analyzeTaste(selections: Record<number, string[]>): TasteAnalysis {
  const scores = computeFullProfile(selections);
  const archetype = findArchetype(scores);
  const topTraits = getTopTraits(scores, 3);

  const catNames = ["music", "film", "dining", "nightlife", "style"] as const;
  const categoryInsights = {} as TasteAnalysis["categoryInsights"];

  for (let i = 0; i < catNames.length; i++) {
    categoryInsights[catNames[i]] = {
      label: getFallbackCategoryInsight(i, selections[i] || [], scores),
      color: CATEGORY_COLORS[i],
    };
  }

  return {
    archetype: {
      name: archetype.name,
      emoji: archetype.emoji,
      tagline: getFallbackTagline(archetype),
      description: getFallbackArchetypeDescription(archetype, scores, selections),
    },
    scores,
    topTraits,
    aesthetic: getFallbackAesthetic(scores),
    categoryInsights,
    rawSelections: selections,
  };
}

/**
 * Build a prompt for LLM-based description generation.
 * Sends the deterministic analysis + raw selections so the LLM
 * can write fresh, personalized copy each time.
 */
export function buildLLMPrompt(analysis: TasteAnalysis, variation?: number): string {
  const { archetype, scores, topTraits, rawSelections } = analysis;

  const catLabels = ["Music", "Movies & TV", "Dining", "Nightlife & Vibes", "Brands & Style"];
  const selectionsSummary = catLabels
    .map((label, i) => {
      const picks = rawSelections[i] || [];
      return picks.length > 0 ? `${label}: ${picks.join(", ")}` : null;
    })
    .filter(Boolean)
    .join("\n");

  const traitsSummary = topTraits.map((t) => `${t.trait} (${t.value})`).join(", ");

  const scoresSummary = Object.entries(scores)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  return `You are a cultural taste analyst for "The Sweet Spot," an app that maps people's personality through their cultural preferences.

Based on the user's quiz selections and computed personality profile, generate fresh, specific, personality-driven descriptions. Be playful, sharp, and surprisingly specific — like a best friend who knows them well, not a horoscope.

USER'S SELECTIONS:
${selectionsSummary}

COMPUTED PERSONALITY SCORES:
${scoresSummary}

TOP TRAITS: ${traitsSummary}

MATCHED ARCHETYPE: ${archetype.name}

Generate the following JSON (no markdown, just raw JSON):
{
  "archetypeTagline": "<8-12 words, punchy, feels personal — NOT generic>",
  "archetypeDescription": "<2 sentences max, ~30 words. Reference specific selections to show you understand their taste. Make them feel SEEN.>",
  "categoryInsights": {
    "music": "<3-5 words describing their music personality based on their picks>",
    "film": "<3-5 words describing their film/TV personality>",
    "dining": "<3-5 words describing their dining personality>",
    "nightlife": "<3-5 words describing their nightlife personality>",
    "style": "<3-5 words describing their style personality>"
  },
  "aesthetic": "<One memorable sentence (10-15 words) capturing their overall vibe. Should feel quotable and shareable.>"
}

RULES:
- Reference their ACTUAL selections — don't be generic
- Don't just list what they picked — interpret what the pattern MEANS
- Avoid cliches like "eclectic taste" or "unique individual"
- Be specific enough that changing even one selection would change the description
- The aesthetic line should be quotable — something they'd want to screenshot and share
- Keep everything concise and punchy
${variation ? `\nVARIATION STYLE #${variation}: ${[
  "Use a warm, poetic tone — like a love letter to their taste. Focus on emotional resonance and sensory language.",
  "Use a bold, confident tone — like a magazine profile. Be sharp, witty, slightly provocative.",
  "Use a storytelling tone — paint a scene or moment that captures who they are. Make it cinematic.",
  "Use a playful, irreverent tone — like a best friend roasting them lovingly. Humor-forward but affectionate.",
  "Use a mysterious, atmospheric tone — like a noir narrator. Moody, evocative, poetic.",
  "Use a minimalist, zen tone — each word earns its place. Sparse but deeply resonant.",
][(variation - 1) % 6]}\nThis is a REGENERATION — the user has already seen a previous version. You MUST produce completely different wording, metaphors, and framing. Same personality, fresh perspective.` : ""}`;
}
