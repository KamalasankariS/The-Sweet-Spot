import { NextRequest, NextResponse } from "next/server";
import { searchEntities } from "@/lib/qloo";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";
  const types = req.nextUrl.searchParams.get("types") || undefined;
  const take = parseInt(req.nextUrl.searchParams.get("take") || "8", 10);

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchEntities(query, types, take);
    return NextResponse.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
