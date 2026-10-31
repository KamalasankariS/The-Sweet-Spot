// ==========================================
// The Sweet Spot — Qloo API Service Layer
// ==========================================

import type {
  QlooSearchResponse,
  QlooInsightsResponse,
  QlooTagsResponse,
  QlooEntity,
  QlooTag,
} from "@/types";

const BASE_URL =
  process.env.QLOO_BASE_URL || "https://hackathon.api.qloo.com";
const API_KEY = process.env.QLOO_API_KEY || "";

// --- Core Request Helper ---

async function qlooGet<T>(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined>
): Promise<T> {
  const filtered: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") filtered[k] = String(v);
  }

  const qs = new URLSearchParams(filtered).toString();
  const url = `${BASE_URL}${endpoint}${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-Api-Key": API_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Qloo API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

// --- Geocode helper (Photon / OSM) ---

const geoCache = new Map<string, { lat: number; lon: number } | null>();

export async function geocode(
  locationQuery: string
): Promise<{ lat: number; lon: number } | null> {
  const key = locationQuery.toLowerCase().trim();
  if (geoCache.has(key)) return geoCache.get(key)!;

  try {
    const params = new URLSearchParams({ q: locationQuery, limit: "1" });
    const res = await fetch(`https://photon.komoot.io/api/?${params}`);
    const data = await res.json();
    const coords = data.features?.[0]?.geometry?.coordinates;
    if (coords && coords.length >= 2) {
      const result = { lat: coords[1], lon: coords[0] };
      geoCache.set(key, result);
      return result;
    }
  } catch {}
  geoCache.set(key, null);
  return null;
}

// --- Endpoint 1: Search ---

export async function searchEntities(
  query: string,
  types?: string,
  take: number = 10,
  location?: string,
  radius?: number
): Promise<QlooEntity[]> {
  // Geocode text location to lat,lon for Qloo's filter.location
  let latlon: string | undefined;
  if (location) {
    const coords = await geocode(location);
    if (coords) latlon = `${coords.lat},${coords.lon}`;
  }

  const data = await qlooGet<QlooSearchResponse>("/search", {
    query,
    types,
    take,
    "filter.location": latlon,
    "filter.radius": radius,
  });
  return data.results || [];
}

export async function resolveEntity(
  name: string,
  type: string
): Promise<QlooEntity | null> {
  const results = await searchEntities(name, type, 1);
  return results[0] || null;
}

export async function resolveMultiple(
  seeds: Array<{ name: string; type: string }>
): Promise<QlooEntity[]> {
  const results = await Promise.all(
    seeds.map((s) => resolveEntity(s.name, s.type))
  );
  return results.filter((r): r is QlooEntity => r !== null);
}

// --- Endpoint 2: Insights (Recommendations) ---

export interface InsightsParams {
  filterType: string;
  signalEntities?: string; // comma-separated IDs
  signalTags?: string;
  signalAge?: string;
  signalGender?: string;
  signalLocationQuery?: string;
  filterLocationQuery?: string;
  filterLocationLat?: number;
  filterLocationLon?: number;
  filterLocationRadius?: number; // in miles
  filterTags?: string;
  filterTagsOperator?: "union" | "intersection";
  filterPopularityMin?: number;
  filterExcludeEntities?: string;
  filterResultsEntities?: string; // for re-ranking
  explainability?: boolean;
  sortBy?: string;
  take?: number;
  page?: number;
}

export async function getInsights(
  params: InsightsParams
): Promise<QlooInsightsResponse> {
  return qlooGet<QlooInsightsResponse>("/v2/insights", {
    "filter.type": params.filterType,
    "signal.interests.entities": params.signalEntities,
    "signal.interests.tags": params.signalTags,
    "signal.demographics.age": params.signalAge,
    "signal.demographics.gender": params.signalGender,
    "signal.location.query": params.signalLocationQuery,
    "filter.location.query": params.filterLocationQuery,
    "filter.location.geo.lat": params.filterLocationLat,
    "filter.location.geo.lon": params.filterLocationLon,
    "filter.location.geo.radius": params.filterLocationRadius,
    "filter.tags": params.filterTags,
    "operator.filter.tags": params.filterTagsOperator,
    "filter.popularity.min": params.filterPopularityMin,
    "filter.exclude.entities": params.filterExcludeEntities,
    "filter.results.entities": params.filterResultsEntities,
    "feature.explainability": params.explainability ? "true" : undefined,
    sort_by: params.sortBy || "affinity",
    take: params.take || 10,
    page: params.page,
  });
}

// Convenience: get place recommendations
export async function getPlaceRecommendations(
  entityIds: string[],
  location: string,
  tags?: string,
  take: number = 10
): Promise<QlooEntity[]> {
  const res = await getInsights({
    filterType: "urn:entity:place",
    signalEntities: entityIds.join(","),
    filterLocationQuery: location,
    filterTags: tags,
    explainability: true,
    take,
  });
  return res.results.entities || [];
}

// Convenience: get artist recommendations
export async function getArtistRecommendations(
  entityIds: string[],
  location?: string,
  take: number = 10
): Promise<QlooEntity[]> {
  const res = await getInsights({
    filterType: "urn:entity:artist",
    signalEntities: entityIds.join(","),
    signalLocationQuery: location,
    take,
  });
  return res.results.entities || [];
}

// Convenience: get demographics for a taste profile
export async function getDemographics(
  entityIds: string[]
): Promise<QlooInsightsResponse["results"]["demographics"]> {
  const res = await getInsights({
    filterType: "urn:demographics",
    signalEntities: entityIds.join(","),
  });
  return res.results.demographics;
}

// Convenience: get taste tags for a profile
export async function getTasteTags(
  entityIds: string[],
  take: number = 20
): Promise<QlooTag[]> {
  const res = await getInsights({
    filterType: "urn:tag",
    signalEntities: entityIds.join(","),
    take,
  });
  return res.results.tags || [];
}

// --- Endpoint 3: Tags ---

export async function searchTags(
  query: string,
  tagTypes?: string,
  parentTypes?: string,
  take: number = 10
): Promise<QlooTag[]> {
  const data = await qlooGet<QlooTagsResponse>("/v2/tags", {
    "filter.query": query,
    "filter.tag.types": tagTypes,
    "filter.parents.types": parentTypes,
    take,
  });
  return data.results.tags || [];
}

// --- Endpoint 4: Audiences ---

export async function getAudiences(
  audienceTypes?: string,
  take: number = 20
) {
  return qlooGet("/v2/audiences", {
    "filter.audience.types": audienceTypes,
    take,
  });
}

// --- Group Harmony Engine ---

export async function computeGroupHarmony(
  memberProfiles: Array<{ userId: string; name: string; entityIds: string[] }>,
  location: string
): Promise<{
  places: QlooEntity[];
  pairAffinities: Array<{
    user1: string;
    user2: string;
    sharedEntities: QlooEntity[];
    score: number;
  }>;
  groupTags: QlooTag[];
}> {
  // 1. Combine all entity IDs from all members
  const allEntityIds = [
    ...new Set(memberProfiles.flatMap((m) => m.entityIds)),
  ];

  // 2. Get places that match the combined taste profile
  const [places, groupTags] = await Promise.all([
    getPlaceRecommendations(allEntityIds, location, undefined, 20),
    getTasteTags(allEntityIds, 15),
  ]);

  // 3. Compute pair affinities by re-ranking each person's places against others
  const pairAffinities: Array<{
    user1: string;
    user2: string;
    sharedEntities: QlooEntity[];
    score: number;
  }> = [];

  for (let i = 0; i < memberProfiles.length; i++) {
    for (let j = i + 1; j < memberProfiles.length; j++) {
      const user1 = memberProfiles[i];
      const user2 = memberProfiles[j];

      // Get recommendations for each user
      const [recs1, recs2] = await Promise.all([
        getInsights({
          filterType: "urn:entity:place",
          signalEntities: user1.entityIds.join(","),
          filterLocationQuery: location,
          take: 20,
        }),
        getInsights({
          filterType: "urn:entity:place",
          signalEntities: user2.entityIds.join(","),
          filterLocationQuery: location,
          take: 20,
        }),
      ]);

      const ids1 = new Set(
        (recs1.results.entities || []).map((e) => e.entity_id)
      );
      const ids2 = new Set(
        (recs2.results.entities || []).map((e) => e.entity_id)
      );
      const shared = (recs1.results.entities || []).filter((e) =>
        ids2.has(e.entity_id)
      );

      const overlapRatio =
        shared.length / Math.max(ids1.size, ids2.size, 1);
      const score = Math.round(overlapRatio * 100);

      pairAffinities.push({
        user1: user1.userId,
        user2: user2.userId,
        sharedEntities: shared,
        score: Math.min(score * 2.5, 99), // Scale for better UX range
      });
    }
  }

  return { places, pairAffinities, groupTags };
}
