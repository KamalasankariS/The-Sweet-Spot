import { NextRequest, NextResponse } from "next/server";

interface ITunesResult {
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  artworkUrl100?: string;
  trackId?: number;
  wrapperType?: string;
  kind?: string;
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";
  const take = parseInt(req.nextUrl.searchParams.get("take") || "6", 10);

  if (!query.trim() || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const params = new URLSearchParams({
      term: query,
      media: "music",
      entity: "song",
      limit: String(Math.min(take * 2, 20)),
    });

    const res = await fetch(`https://itunes.apple.com/search?${params}`);
    const data = await res.json();
    const items: ITunesResult[] = data.results || [];

    // Filter to actual songs only
    const songs = items.filter(
      (r) => r.wrapperType === "track" && r.kind === "song" && r.trackName && r.artistName
    );

    // Deduplicate by trackName + artistName
    const seen = new Set<string>();
    const unique = songs.filter((r) => {
      const key = `${r.artistName?.toLowerCase()}|${r.trackName?.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const results = unique.slice(0, take).map((r) => ({
      type: "album" as const,
      artistName: r.artistName || "",
      trackName: r.trackName || "",
      artworkUrl: r.artworkUrl100?.replace("100x100", "200x200") || "",
      entityId: String(r.trackId || ""),
      description: r.collectionName || "",
    }));

    return NextResponse.json({ results }, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
