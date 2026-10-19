import { NextRequest, NextResponse } from "next/server";
import { searchTags } from "@/lib/qloo";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";
  const take = parseInt(req.nextUrl.searchParams.get("take") || "6", 10);

  if (!query.trim() || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const tags = await searchTags(
      query,
      "urn:tag:specialty_dish:place,urn:tag:cuisine:qloo,urn:tag:menu_highlight:qloo",
      undefined,
      take * 2 // fetch extra to deduplicate
    );

    // Deduplicate by normalized name (same dish can appear under multiple tag types)
    const seen = new Set<string>();
    const unique = tags.filter((t) => {
      const key = t.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, take);

    return NextResponse.json({ results: unique });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
