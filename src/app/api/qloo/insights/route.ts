import { NextRequest, NextResponse } from "next/server";
import { getInsights } from "@/lib/qloo";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  const filterType = params.get("filter.type");
  if (!filterType) {
    return NextResponse.json(
      { error: "filter.type is required" },
      { status: 400 }
    );
  }

  try {
    const result = await getInsights({
      filterType,
      signalEntities: params.get("signal.entities") || undefined,
      signalTags: params.get("signal.tags") || undefined,
      signalAge: params.get("signal.age") || undefined,
      signalGender: params.get("signal.gender") || undefined,
      filterLocationQuery: params.get("filter.location") || undefined,
      filterTags: params.get("filter.tags") || undefined,
      filterTagsOperator:
        (params.get("filter.tags.operator") as "union" | "intersection") ||
        undefined,
      filterPopularityMin: params.get("filter.popularity.min")
        ? parseFloat(params.get("filter.popularity.min")!)
        : undefined,
      filterExcludeEntities:
        params.get("filter.exclude.entities") || undefined,
      explainability: params.get("explainability") === "true",
      take: parseInt(params.get("take") || "10", 10),
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
