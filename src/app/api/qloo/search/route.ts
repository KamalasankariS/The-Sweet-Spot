import { NextRequest, NextResponse } from "next/server";
import { searchEntities } from "@/lib/qloo";
import type { QlooEntity } from "@/types";

const COLLAB_PATTERN = /[&,]| x | feat\.?| with /i;
const JUNK_SUFFIX = /vevo|official|music|youtube|topic$/i;

// In-memory LRU cache for Qloo search results (survives across requests in the same serverless instance)
const CACHE_MAX = 200;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: QlooEntity[]; ts: number }>();

function cacheGet(key: string): QlooEntity[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  // Move to end (LRU refresh)
  cache.delete(key);
  cache.set(key, entry);
  return entry.data;
}

function cacheSet(key: string, data: QlooEntity[]) {
  if (cache.size >= CACHE_MAX) {
    // Evict oldest (first key)
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { data, ts: Date.now() });
}

function isSoloArtist(name: string): boolean {
  return !COLLAB_PATTERN.test(name) && !JUNK_SUFFIX.test(name.replace(/\s/g, ""));
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";
  const types = req.nextUrl.searchParams.get("types") || undefined;
  const take = parseInt(req.nextUrl.searchParams.get("take") || "8", 10);
  const location = req.nextUrl.searchParams.get("location") || undefined;

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const cacheKey = `${query.toLowerCase().trim()}|${types || ""}|${take}|${location || ""}`;
    const cached = cacheGet(cacheKey);
    const results = cached || await searchEntities(query, types, take + 4, location);
    if (!cached) cacheSet(cacheKey, [...results]);
    const isArtistSearch = types?.includes("urn:entity:artist");

    if (isArtistSearch && results.length > 0) {
      const q = query.toLowerCase().trim();

      // Check if there's a real solo artist match (not VEVO channels, not collabs)
      const hasSoloMatch = results.some((r: QlooEntity) => {
        const name = r.name.toLowerCase();
        return isSoloArtist(r.name) && (name === q || name.startsWith(q) || q.startsWith(name));
      });

      // Always synthesize if no clean solo match exists
      if (!hasSoloMatch && q.length >= 3) {
        // Find a collab that contains the query name
        const bestCollab = results.find((r: QlooEntity) =>
          r.name.toLowerCase().startsWith(q)
        ) || results.find((r: QlooEntity) =>
          r.name.toLowerCase().includes(q)
        );

        if (bestCollab) {
          // Extract the solo name from the collab
          const soloName = bestCollab.name.split(COLLAB_PATTERN)[0].trim();
          if (soloName.length >= 2 && soloName.toLowerCase().includes(q.split(" ")[0])) {
            const soloEntry: QlooEntity = {
              ...bestCollab,
              id: `solo-${bestCollab.entity_id}`,
              entity_id: bestCollab.entity_id,
              name: soloName,
              properties: {
                ...bestCollab.properties,
                short_description: bestCollab.properties?.short_description
                  ? String(bestCollab.properties.short_description).split(/[;.]/)[0].trim()
                  : undefined,
              },
            };
            results.unshift(soloEntry);
          }
        }
      }

      // Filter out VEVO/channel entries, then sort
      const filtered = results.filter((r: QlooEntity) =>
        !JUNK_SUFFIX.test(r.name.replace(/\s/g, ""))
      );

      // Sort: exact/close solo matches first, then other solos, then collabs
      filtered.sort((a: QlooEntity, b: QlooEntity) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        // Exact match first
        if (aName === q && bName !== q) return -1;
        if (bName === q && aName !== q) return 1;
        // Solo before collab
        const aSolo = isSoloArtist(a.name) ? 0 : 1;
        const bSolo = isSoloArtist(b.name) ? 0 : 1;
        if (aSolo !== bSolo) return aSolo - bSolo;
        // Shorter name = closer match
        return aName.length - bName.length;
      });

      return NextResponse.json({ results: filtered.slice(0, take) }, {
        headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
      });
    }

    return NextResponse.json({ results: results.slice(0, take) }, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
