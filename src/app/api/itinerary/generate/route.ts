import { NextRequest, NextResponse } from "next/server";
import { getInsights } from "@/lib/qloo";

interface MemberData {
  name: string;
  selections: Record<number, string[]>;
  entityIds?: Record<number, Record<string, string>>;
}

interface RequestBody {
  members: MemberData[];
  location: string;
  occasion: string;
  groupName: string;
}

// Category index → Qloo entity type for insights filtering
const CATEGORY_FILTER_TYPES: Record<number, string> = {
  2: "urn:entity:place", // Dining → restaurant places
  3: "urn:entity:place", // Nightlife → bar/venue places
};

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { members, location, occasion, groupName } = body;

    // Collect all entity IDs from all members across all categories
    const allEntityIds: string[] = [];
    for (const member of members) {
      if (member.entityIds) {
        for (const catMap of Object.values(member.entityIds)) {
          allEntityIds.push(...Object.values(catMap));
        }
      }
    }

    const uniqueEntityIds = [...new Set(allEntityIds)];

    if (uniqueEntityIds.length === 0) {
      return NextResponse.json({ results: null, source: "no-entities" });
    }

    // Get Qloo recommendations for restaurants and nightlife venues in the location
    const signalEntities = uniqueEntityIds.join(",");

    const [diningRecs, nightlifeRecs, wildcardRecs] = await Promise.all([
      // Dining: restaurants
      getInsights({
        filterType: "urn:entity:place",
        signalEntities,
        filterLocationQuery: location,
        filterTags: "urn:tag:genre:place:restaurant",
        explainability: true,
        take: 5,
      }).catch(() => null),

      // Nightlife: bars, clubs
      getInsights({
        filterType: "urn:entity:place",
        signalEntities,
        filterLocationQuery: location,
        filterTags: "urn:tag:genre:place:restaurant:bar,urn:tag:category:place:bar",
        filterTagsOperator: "union",
        explainability: true,
        take: 5,
      }).catch(() => null),

      // Wildcard: broader places (no tag filter — just location + taste)
      getInsights({
        filterType: "urn:entity:place",
        signalEntities,
        filterLocationQuery: location,
        explainability: true,
        take: 5,
      }).catch(() => null),
    ]);

    // Also get taste tags for the group
    const tasteTags = await getInsights({
      filterType: "urn:tag",
      signalEntities,
      take: 10,
    }).catch(() => null);

    return NextResponse.json({
      results: {
        dining: diningRecs?.results?.entities || [],
        nightlife: nightlifeRecs?.results?.entities || [],
        wildcard: wildcardRecs?.results?.entities || [],
        tags: tasteTags?.results?.tags || [],
      },
      source: "qloo",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message, source: "error" }, { status: 500 });
  }
}
