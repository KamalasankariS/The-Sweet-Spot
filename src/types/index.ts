// ==========================================
// The Sweet Spot — Core Types
// ==========================================

// --- Qloo API Types ---

export interface QlooEntity {
  id: string;
  entity_id?: string;
  name: string;
  types: string[];
  properties: Record<string, string | number | boolean>;
  tags?: QlooTag[];
  popularity?: number;
  query?: {
    affinity?: number;
    explainability?: Record<string, unknown>;
  };
}

export interface QlooTag {
  id: string;
  tag_id?: string;
  name: string;
  type?: string;
  query?: { affinity?: number };
}

export interface QlooSearchResponse {
  results: QlooEntity[];
  meta?: { total: number; query: string };
}

export interface QlooInsightsResponse {
  success: boolean;
  results: {
    entities?: QlooEntity[];
    demographics?: Array<{
      query: {
        age: Record<string, number>;
        gender: Record<string, number>;
      };
    }>;
    tags?: QlooTag[];
  };
  meta?: Record<string, unknown>;
}

export interface QlooTagsResponse {
  success: boolean;
  results: { tags: QlooTag[] };
  meta?: { total: number };
}

// --- User & Taste Types ---

export interface TasteProfile {
  id: string;
  userId: string;
  artists: QlooEntity[];
  movies: QlooEntity[];
  tvShows: QlooEntity[];
  books: QlooEntity[];
  brands: QlooEntity[];
  places: QlooEntity[];
  tags: QlooTag[];
  createdAt: string;
  updatedAt: string;
}

export interface TasteSeed {
  entityId: string;
  name: string;
  type: string;
  category: TasteCategory;
}

export type TasteCategory =
  | "music"
  | "movies"
  | "tv"
  | "dining"
  | "nightlife"
  | "fashion";

export interface User {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  tasteProfile?: TasteProfile;
  culturalDna?: CulturalDNA;
}

// --- Group Types ---

export interface Group {
  id: string;
  name: string;
  createdBy: string;
  members: GroupMember[];
  occasion?: OccasionType;
  location?: string;
  date?: string;
  mode: "social" | "corporate";
  createdAt: string;
}

export interface GroupMember {
  userId: string;
  name: string;
  avatarUrl?: string;
  tasteProfile?: TasteProfile;
  chemistryScores?: Record<string, number>; // userId -> compatibility %
}

export type OccasionType =
  | "chill-night"
  | "birthday"
  | "date-night"
  | "celebration"
  | "team-dinner"
  | "client-entertainment"
  | "welcome-night"
  | "offsite"
  | "custom";

// --- Harmony & Chemistry Types ---

export interface HarmonyResult {
  groupId: string;
  overallScore: number;
  pairScores: PairScore[];
  sharedTastes: QlooTag[];
  divergences: TasteDivergence[];
  vibeDescription: string;
}

export interface PairScore {
  user1Id: string;
  user1Name: string;
  user2Id: string;
  user2Name: string;
  score: number;
}

export interface TasteDivergence {
  userId: string;
  userName: string;
  uniqueTaste: string;
  description: string;
}

// --- Itinerary Types ---

export interface Itinerary {
  id: string;
  groupId: string;
  occasion: OccasionType;
  location: string;
  date: string;
  stops: ItineraryStop[];
  wildcardPick?: ItineraryStop;
  conversationStarters: string[];
  groupVibeTag: string;
  createdAt: string;
}

export interface ItineraryStop {
  order: number;
  type: "pre-drinks" | "dinner" | "activity" | "nightcap" | "wildcard";
  venue: QlooEntity;
  time: string;
  affinityScore: number;
  reason: string;
  tags: string[];
}

// --- Cultural DNA / Wrapped Types ---

export interface CulturalDNA {
  userId: string;
  musicVibe: string;
  filmVibe: string;
  diningVibe: string;
  nightlifeVibe: string;
  overallAesthetic: string;
  topTags: QlooTag[];
  demographics?: {
    age: Record<string, number>;
    gender: Record<string, number>;
  };
}

export interface NightRecap {
  id: string;
  groupId: string;
  itineraryId: string;
  date: string;
  stopsVisited: number;
  totalDuration: string;
  groupMatchScore: number;
  vibeOfTheNight: string;
  discoveries: string[];
  memberHighlights: MemberHighlight[];
}

export interface MemberHighlight {
  userId: string;
  userName: string;
  highlight: string;
}

export interface WrappedData {
  userId: string;
  period: "weekly" | "monthly" | "quarterly";
  totalOutings: number;
  spotsVisited: number;
  neighborhoodsExplored: number;
  topCuisine: string;
  adventureScore: number;
  tasteTwin?: { userId: string; name: string; score: number };
  vibeEvolution: string[];
  wildcardHitRate: number;
  groupDnaCard: CulturalDNA;
}
