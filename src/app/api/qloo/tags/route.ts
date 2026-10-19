import { NextRequest, NextResponse } from "next/server";
import { searchTags } from "@/lib/qloo";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";
  const tagTypes = req.nextUrl.searchParams.get("tagTypes") || undefined;
  const parentTypes = req.nextUrl.searchParams.get("parentTypes") || undefined;
  const take = parseInt(req.nextUrl.searchParams.get("take") || "10", 10);

  try {
    const tags = await searchTags(query, tagTypes, parentTypes, take);
    return NextResponse.json({ tags });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
