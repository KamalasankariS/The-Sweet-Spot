import { NextRequest, NextResponse } from "next/server";
import {
  getInsights,
  getTasteTags,
  searchEntities,
  resolveEntity,
} from "@/lib/qloo";
import type { QlooEntity, QlooTag } from "@/types";

interface MemberInput {
  name: string;
  selections: Record<string, string[]>;
}

const CATEGORY_TYPE_MAP: Record<string, string> = {
  "0": "urn:entity:artist",
  "1": "urn:entity:movie",
  "2": "urn:entity:place",
  "3": "urn:entity:place",
  "4": "urn:entity:brand",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { members, location, occasion } = body as {
      members: MemberInput[];
      location: string;
      occasion: string;
    };

    if (!members || members.length < 1) {
      return NextResponse.json(
        { error: "At least 1 member required" },
        { status: 400 }
      );
    }

    // Step 1: Resolve all member selections to Qloo entity IDs
    const memberEntities: Array<{
      name: string;
      entityIds: string[];
      entities: QlooEntity[];
    }> = [];

    for (const member of members) {
      const allNames: Array<{ name: string; type: string }> = [];

      for (const [catIndex, items] of Object.entries(member.selections)) {
        const type = CATEGORY_TYPE_MAP[catIndex] || "urn:entity:place";
        for (const item of items) {
          allNames.push({ name: item, type });
        }
      }

      // Resolve each name to a Qloo entity
      const resolved: QlooEntity[] = [];
      for (const seed of allNames) {
        try {
          const entity = await resolveEntity(seed.name, seed.type);
          if (entity) resolved.push(entity);
        } catch {
          // Skip unresolvable entities
        }
      }

      memberEntities.push({
        name: member.name,
        entityIds: resolved.map((e) => e.id),
        entities: resolved,
      });
    }

    // Step 2: Combine all entity IDs
    const allEntityIds = [
      ...new Set(memberEntities.flatMap((m) => m.entityIds)),
    ];

    if (allEntityIds.length === 0) {
      return NextResponse.json({
        places: [],
        pairScores: [],
        groupTags: [],
        groupScore: 0,
        vibeDescription: "Not enough data",
      });
    }

    // Step 3: Get group recommendations and taste tags
    const [placesRes, groupTags] = await Promise.all([
      getInsights({
        filterType: "urn:entity:place",
        signalEntities: allEntityIds.join(","),
        filterLocationQuery: location || undefined,
        explainability: true,
        take: 20,
      }),
      getTasteTags(allEntityIds, 15),
    ]);

    const places = placesRes.results.entities || [];

    // Step 4: Compute pair scores
    const pairScores: Array<{
      user1: string;
      user2: string;
      score: number;
    }> = [];

    for (let i = 0; i < memberEntities.length; i++) {
      for (let j = i + 1; j < memberEntities.length; j++) {
        const shared = memberEntities[i].entityIds.filter((id) =>
          memberEntities[j].entityIds.includes(id)
        );
        const totalUnique = new Set([
          ...memberEntities[i].entityIds,
          ...memberEntities[j].entityIds,
        ]).size;
        const overlap = totalUnique > 0 ? shared.length / totalUnique : 0;
        // Scale to a more useful range (60-98)
        const score = Math.round(60 + overlap * 38);

        pairScores.push({
          user1: memberEntities[i].name,
          user2: memberEntities[j].name,
          score: Math.min(score, 98),
        });
      }
    }

    // Step 5: Compute group score
    const groupScore =
      pairScores.length > 0
        ? Math.round(
            pairScores.reduce((sum, p) => sum + p.score, 0) /
              pairScores.length
          )
        : 75;

    // Step 6: Generate vibe description from top tags
    const topTagNames = groupTags.slice(0, 3).map((t) => t.name);
    const vibeDescription =
      topTagNames.length > 0
        ? topTagNames.join(" meets ")
        : "Eclectic and adventurous";

    // Step 7: Pick a wildcard — get places with lower popularity
    let wildcard: QlooEntity | null = null;
    if (places.length > 5) {
      wildcard = places.find(
        (p) => (p.popularity || 0) < 0.5 && (p.query?.affinity || 0) > 0.7
      ) || places[places.length - 1];
    }

    return NextResponse.json({
      places: places.slice(0, 12),
      pairScores,
      groupTags,
      groupScore,
      vibeDescription,
      wildcard,
      occasion,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
