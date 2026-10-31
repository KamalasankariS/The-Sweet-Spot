import { NextRequest, NextResponse } from "next/server";
import { getInsights } from "@/lib/qloo";

// Haversine distance in miles
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Extract coordinates from Qloo entity properties if available
function extractCoordsFromEntity(props: Record<string, unknown> | undefined): { lat: number; lon: number } | null {
  if (!props) return null;
  // Check common Qloo property names for coordinates
  const loc = props.location as Record<string, unknown> | undefined;
  if (loc?.lat && loc?.lon) return { lat: Number(loc.lat), lon: Number(loc.lon) };
  if (loc?.latitude && loc?.longitude) return { lat: Number(loc.latitude), lon: Number(loc.longitude) };
  const geo = props.geo as Record<string, unknown> | undefined;
  if (geo?.lat && geo?.lon) return { lat: Number(geo.lat), lon: Number(geo.lon) };
  if (geo?.latitude && geo?.longitude) return { lat: Number(geo.latitude), lon: Number(geo.longitude) };
  // Check top-level lat/lon
  if (props.lat && props.lon) return { lat: Number(props.lat), lon: Number(props.lon) };
  if (props.latitude && props.longitude) return { lat: Number(props.latitude), lon: Number(props.longitude) };
  return null;
}

// Event type → Qloo tag queries for smart suggestions
const EVENT_TAG_MAP: Record<string, { label: string; tags: string; icon: string }[]> = {
  "date-night": [
    { label: "Romantic Restaurants", tags: "urn:tag:genre:place:restaurant", icon: "restaurant" },
    { label: "Cocktail Bars", tags: "urn:tag:genre:place:restaurant:bar,urn:tag:category:place:bar", icon: "cocktail" },
    { label: "Theaters & Shows", tags: "urn:tag:category:place:theater,urn:tag:category:place:performing_arts_theater", icon: "theater" },
    { label: "Live Music", tags: "urn:tag:category:place:music_venue,urn:tag:category:place:jazz_club", icon: "music" },
    { label: "Parks & Scenic", tags: "urn:tag:category:place:park,urn:tag:category:place:garden,urn:tag:category:place:scenic_point", icon: "sunrise" },
    { label: "Dessert & Cafes", tags: "urn:tag:genre:place:restaurant:cafe,urn:tag:genre:place:restaurant:dessert", icon: "cake" },
    { label: "Museums & Galleries", tags: "urn:tag:category:place:museum,urn:tag:category:place:art_gallery", icon: "palette" },
    { label: "Spas & Wellness", tags: "urn:tag:category:place:spa,urn:tag:category:place:wellness", icon: "spa" },
  ],
  "friends-hangout": [
    { label: "Restaurants", tags: "urn:tag:genre:place:restaurant", icon: "restaurant" },
    { label: "Bars & Nightlife", tags: "urn:tag:genre:place:restaurant:bar,urn:tag:category:place:bar,urn:tag:category:place:nightclub", icon: "cocktail" },
    { label: "Bowling & Arcades", tags: "urn:tag:category:place:bowling_alley,urn:tag:category:place:arcade,urn:tag:category:place:amusement_center", icon: "bowling" },
    { label: "Live Music & Shows", tags: "urn:tag:category:place:music_venue,urn:tag:category:place:comedy_club", icon: "music" },
    { label: "Theaters & Movies", tags: "urn:tag:category:place:theater,urn:tag:category:place:movie_theater,urn:tag:category:place:performing_arts_theater", icon: "theater" },
    { label: "Karaoke & Games", tags: "urn:tag:category:place:karaoke,urn:tag:category:place:escape_room,urn:tag:category:place:entertainment", icon: "mic" },
    { label: "Sports & Rec", tags: "urn:tag:category:place:sports_complex,urn:tag:category:place:stadium,urn:tag:category:place:recreation", icon: "stadium" },
    { label: "Late Night Eats", tags: "urn:tag:genre:place:restaurant:fast_food,urn:tag:genre:place:restaurant:pizza", icon: "taco" },
  ],
  "team-outing": [
    { label: "Group Dining", tags: "urn:tag:genre:place:restaurant", icon: "restaurant" },
    { label: "Bars & Lounges", tags: "urn:tag:genre:place:restaurant:bar,urn:tag:category:place:bar,urn:tag:category:place:brewery", icon: "cocktail" },
    { label: "Bowling & Activities", tags: "urn:tag:category:place:bowling_alley,urn:tag:category:place:entertainment,urn:tag:category:place:amusement_center", icon: "bowling" },
    { label: "Escape Rooms & Games", tags: "urn:tag:category:place:escape_room,urn:tag:category:place:arcade,urn:tag:category:place:amusement_center", icon: "puzzle" },
    { label: "Outdoor & Parks", tags: "urn:tag:category:place:park,urn:tag:category:place:recreation,urn:tag:category:place:sports_complex", icon: "tree" },
    { label: "Comedy & Shows", tags: "urn:tag:category:place:comedy_club,urn:tag:category:place:performing_arts_theater,urn:tag:category:place:theater", icon: "laugh" },
  ],
  "solo-adventure": [
    { label: "Cafes & Coffee", tags: "urn:tag:genre:place:restaurant:cafe,urn:tag:genre:place:restaurant:coffee", icon: "coffee" },
    { label: "Museums & Culture", tags: "urn:tag:category:place:museum,urn:tag:category:place:art_gallery,urn:tag:category:place:cultural_center", icon: "palette" },
    { label: "Parks & Nature", tags: "urn:tag:category:place:park,urn:tag:category:place:garden,urn:tag:category:place:scenic_point", icon: "tree" },
    { label: "Bookstores & Libraries", tags: "urn:tag:category:place:bookstore,urn:tag:category:place:library", icon: "book" },
    { label: "Theaters & Cinema", tags: "urn:tag:category:place:movie_theater,urn:tag:category:place:theater,urn:tag:category:place:performing_arts_theater", icon: "theater" },
    { label: "Restaurants & Eateries", tags: "urn:tag:genre:place:restaurant", icon: "restaurant" },
    { label: "Spas & Wellness", tags: "urn:tag:category:place:spa,urn:tag:category:place:wellness,urn:tag:category:place:yoga_studio", icon: "spa" },
    { label: "Markets & Shopping", tags: "urn:tag:category:place:market,urn:tag:category:place:shopping_mall,urn:tag:category:place:flea_market", icon: "shop" },
  ],
  "celebration": [
    { label: "Fine Dining", tags: "urn:tag:genre:place:restaurant", icon: "restaurant" },
    { label: "Rooftop & Cocktail Bars", tags: "urn:tag:genre:place:restaurant:bar,urn:tag:category:place:bar", icon: "cocktail" },
    { label: "Clubs & Dance", tags: "urn:tag:category:place:nightclub,urn:tag:category:place:dance_club", icon: "disco" },
    { label: "Live Music & Shows", tags: "urn:tag:category:place:music_venue,urn:tag:category:place:performing_arts_theater", icon: "music" },
    { label: "Venues & Event Spaces", tags: "urn:tag:category:place:event_space,urn:tag:category:place:banquet_hall,urn:tag:category:place:venue", icon: "building" },
    { label: "Dessert & Bakeries", tags: "urn:tag:genre:place:restaurant:dessert,urn:tag:genre:place:restaurant:bakery", icon: "cake" },
    { label: "Karaoke & Fun", tags: "urn:tag:category:place:karaoke,urn:tag:category:place:entertainment,urn:tag:category:place:arcade", icon: "mic" },
    { label: "Scenic Spots", tags: "urn:tag:category:place:park,urn:tag:category:place:scenic_point,urn:tag:category:place:garden", icon: "sunrise" },
  ],
};

// Fallback for custom events
const DEFAULT_CATEGORIES = [
  { label: "Restaurants", tags: "urn:tag:genre:place:restaurant", icon: "restaurant" },
  { label: "Bars & Drinks", tags: "urn:tag:genre:place:restaurant:bar,urn:tag:category:place:bar", icon: "cocktail" },
  { label: "Theaters & Shows", tags: "urn:tag:category:place:theater,urn:tag:category:place:performing_arts_theater,urn:tag:category:place:movie_theater", icon: "theater" },
  { label: "Activities & Fun", tags: "urn:tag:category:place:entertainment,urn:tag:category:place:bowling_alley,urn:tag:category:place:arcade", icon: "target" },
  { label: "Parks & Outdoors", tags: "urn:tag:category:place:park,urn:tag:category:place:garden,urn:tag:category:place:recreation", icon: "tree" },
  { label: "Museums & Culture", tags: "urn:tag:category:place:museum,urn:tag:category:place:art_gallery", icon: "palette" },
];

// Dietary preference → Qloo restaurant genre/category tags
const DIETARY_QLOO_TAGS: Record<string, string> = {
  vegetarian: "urn:tag:genre:place:restaurant:vegetarian",
  vegan: "urn:tag:genre:place:restaurant:vegan",
  "gluten-free": "urn:tag:genre:place:restaurant:gluten_free",
  halal: "urn:tag:genre:place:restaurant:halal",
  kosher: "urn:tag:genre:place:restaurant:kosher",
  pescatarian: "urn:tag:genre:place:restaurant:seafood",
  jain: "urn:tag:genre:place:restaurant:vegetarian",
  "no-pork": "urn:tag:genre:place:restaurant:halal",
};

function isRestaurantCategory(label: string): boolean {
  const lower = label.toLowerCase();
  return lower.includes("restaurant") || lower.includes("dining") || lower.includes("eat") || lower.includes("cafe") || lower.includes("dessert") || lower.includes("bakeri");
}

export async function GET(req: NextRequest) {
  const eventType = req.nextUrl.searchParams.get("event") || "custom";
  const location = req.nextUrl.searchParams.get("location") || "";
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") || "");
  const lon = parseFloat(req.nextUrl.searchParams.get("lon") || "");
  const radiusMi = parseFloat(req.nextUrl.searchParams.get("radius") || "5");
  const hasCoords = !isNaN(lat) && !isNaN(lon);
  const dietaryParam = req.nextUrl.searchParams.get("dietary") || "";
  const dietaryPrefs = dietaryParam ? dietaryParam.split(",").filter(Boolean) : [];
  const boostEntities = (req.nextUrl.searchParams.get("boostEntities") || "").split(",").filter(Boolean);

  if (!location.trim()) {
    return NextResponse.json({ suggestions: [], source: "no-location" });
  }

  const categories = EVENT_TAG_MAP[eventType] || DEFAULT_CATEGORIES;

  try {
    // Build dietary Qloo tags for food category queries
    const dietaryTags = dietaryPrefs
      .map((d) => DIETARY_QLOO_TAGS[d])
      .filter(Boolean);
    const uniqueDietaryTags = [...new Set(dietaryTags)];
    const hasDietaryTags = uniqueDietaryTags.length > 0;

    const results = await Promise.all(
      categories.map(async (cat) => {
        try {
          const isFoodCat = isRestaurantCategory(cat.label);

          // For food categories with dietary prefs: query with dietary tags appended
          // so Qloo returns places that match the dietary type directly
          let tags = cat.tags;
          let operator: "union" | "intersection" = "union";
          if (isFoodCat && hasDietaryTags) {
            tags = uniqueDietaryTags.join(",");
            operator = "union";
          }

          const res = await getInsights({
            filterType: "urn:entity:place",
            filterLocationQuery: location,
            ...(hasCoords ? {
              filterLocationLat: lat,
              filterLocationLon: lon,
              filterLocationRadius: radiusMi,
              sortBy: "distance",
            } : {}),
            filterTags: tags,
            filterTagsOperator: operator,
            explainability: true,
            take: 8,
            // Boost recommendations based on user's itinerary history
            ...(boostEntities.length > 0 ? {
              signalEntities: boostEntities.slice(0, 10).join(","),
            } : {}),
          });

          // Process entities: extract data and compute distance from built-in coords only (no geocoding)
          const entities = (res.results?.entities || []).map((e) => {
            const eAny = e as unknown as Record<string, unknown>;
            const props = eAny.properties as Record<string, unknown> | undefined;
            const query = eAny.query as Record<string, unknown> | undefined;
            const img = props?.image as Record<string, unknown> | undefined;
            const address = (props?.address as string) || undefined;
            const builtInCoords = extractCoordsFromEntity(props);

            let distanceMi: number | undefined;
            if (hasCoords && builtInCoords) {
              distanceMi = Math.round(haversine(lat, lon, builtInCoords.lat, builtInCoords.lon) * 10) / 10;
            }

            return {
              name: e.name,
              entity_id: e.entity_id,
              imageUrl: img?.url as string | undefined,
              address,
              description: (props?.short_description as string) || undefined,
              affinity: query?.affinity
                ? Math.round(Number(query.affinity) * 100)
                : undefined,
              distanceMi,
            };
          });

          return {
            category: cat.label,
            icon: cat.icon,
            places: entities,
            dietaryFiltered: isFoodCat && hasDietaryTags,
          };
        } catch {
          return { category: cat.label, icon: cat.icon, places: [] };
        }
      })
    );

    return NextResponse.json({
      suggestions: results.filter((r) => r.places.length > 0),
      dietaryPrefs: dietaryPrefs.length > 0 ? dietaryPrefs : undefined,
      source: "qloo",
    }, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ suggestions: [], error: message, source: "error" }, { status: 500 });
  }
}
