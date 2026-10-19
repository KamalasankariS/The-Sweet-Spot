import { NextRequest, NextResponse } from "next/server";
import { searchEntities } from "@/lib/qloo";
import type { QlooEntity } from "@/types";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";
  const take = parseInt(req.nextUrl.searchParams.get("take") || "6", 10);

  if (!query.trim() || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Search both artists and albums in parallel
    const [artists, albums] = await Promise.all([
      searchEntities(query, "urn:entity:artist", take),
      searchEntities(query, "urn:entity:album", take),
    ]);

    // Build artist results (with "pick artist, then type song" flow)
    const artistResults = artists.map((a: QlooEntity) => ({
      type: "artist" as const,
      artistName: a.name,
      trackName: "",
      artworkUrl: a.properties?.image?.url || "",
      entityId: a.entity_id,
      description: a.properties?.short_description || "",
    }));

    // Build album results (song/album with cover art, no artist name from Qloo)
    const albumResults = albums.map((a: QlooEntity) => ({
      type: "album" as const,
      artistName: "",
      trackName: a.name,
      artworkUrl: a.properties?.image?.url || "",
      entityId: a.entity_id,
      description: a.disambiguation || "",
    }));

    // Interleave: prioritize artists first (more useful for identification),
    // then albums for cover art
    const q = query.toLowerCase().trim();

    // Sort artists: exact match first, solo artists before collabs, shorter names first
    artistResults.sort((a, b) => {
      const aName = a.artistName.toLowerCase();
      const bName = b.artistName.toLowerCase();
      const aExact = aName === q ? 0 : 1;
      const bExact = bName === q ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      const collab = /[&,]| x | feat/i;
      const aCollab = collab.test(a.artistName) ? 1 : 0;
      const bCollab = collab.test(b.artistName) ? 1 : 0;
      if (aCollab !== bCollab) return aCollab - bCollab;
      return aName.length - bName.length;
    });

    // Combine: top artists first, then albums, capped at take
    const combined = [...artistResults.slice(0, 3), ...albumResults.slice(0, 3)].slice(0, take);

    return NextResponse.json({ results: combined });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
