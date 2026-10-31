import { NextRequest, NextResponse } from "next/server";

// Round-robin across Groq API keys
const GROQ_KEYS = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
].filter(Boolean) as string[];

let keyIndex = 0;
function getNextKey(): string {
  const key = GROQ_KEYS[keyIndex % GROQ_KEYS.length];
  keyIndex++;
  return key;
}

// Cache generated themes to avoid repeat calls
const themeCache = new Map<string, unknown>();

const FALLBACK_THEME = {
  gradient: { colors: ["#FBE4E4", "#E4D4F2", "#D4EDF2"], angle: 135, opacity: 0.5 },
  particles: { type: "sparkles", colors: ["#E8788A", "#B8A0D2", "#E8B88A"], count: 35, speed: "slow", size: "medium" },
  ambience: { baseColor: "#FAF5F0", glowColor: "#E8788A", glowPosition: "top-right", warmth: 0.6, secondaryGlow: "#B8A0D2", secondaryGlowPosition: "bottom-left" },
  mood_description: "soft elegant glow",
};

const MODEL = "qwen/qwen3.8-27b";

async function callGroq(apiKey: string, messages: { role: string; content: string }[]): Promise<string | null> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.8,
      max_tokens: 600,
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}

export async function POST(req: NextRequest) {
  try {
    const { eventType, eventLabel, location, groupSize, timeOfDay, mood } = await req.json();

    // Check cache first
    const cacheKey = `${eventType}-${eventLabel || ""}-${location || ""}-${mood || ""}`;
    if (themeCache.has(cacheKey)) {
      return NextResponse.json(themeCache.get(cacheKey));
    }

    if (GROQ_KEYS.length === 0) {
      return NextResponse.json(FALLBACK_THEME);
    }

    const prompt = `You are a premium UI designer creating immersive ambient themes. Generate a rich visual theme for this event. Return ONLY the JSON object — no thinking, no explanation, no markdown fences.

Event: ${eventLabel || eventType}
Location: ${location || "a trendy city"}
Group size: ${groupSize || "small group"}
Time of day: ${timeOfDay || "evening"}
Mood: ${mood || "match the event type"}

Return exactly this JSON:
{
  "gradient": {
    "colors": ["#color1", "#color2", "#color3"],
    "angle": number_between_90_and_200,
    "opacity": number_between_0.3_and_0.65
  },
  "particles": {
    "type": "PICK_ONE: fireflies | bokeh | hearts | stars | confetti | sparkles | bubbles | petals | lanterns",
    "colors": ["#color1", "#color2", "#color3"],
    "count": number_between_30_and_50,
    "speed": "PICK_ONE: slow | medium",
    "size": "PICK_ONE: medium | large"
  },
  "ambience": {
    "baseColor": "#hex_soft_background_tint",
    "glowColor": "#hex_primary_atmospheric_glow",
    "glowPosition": "PICK_ONE: top-left | top-right | center | bottom-left | bottom-right",
    "warmth": number_between_0.3_and_0.9,
    "secondaryGlow": "#hex_secondary_glow",
    "secondaryGlowPosition": "PICK_ONE: top-left | top-right | center | bottom-left | bottom-right"
  },
  "mood_description": "2-3 evocative words"
}

CRITICAL RULES:
- Date Night → warm rose/blush/gold tones, hearts or fireflies or lanterns, high warmth
- Friends Night → purple/lavender/pink tones, bokeh or confetti or bubbles, medium warmth
- Team Outing → blue/teal/silver tones, bokeh or sparkles, cool warmth
- Solo Adventure → green/gold/earth tones, fireflies or sparkles or petals, medium warmth
- Celebration → vibrant pink/gold/purple, confetti or sparkles, high warmth
- Chill Night → deep blue/purple/indigo, stars or fireflies, low warmth
- Custom → creative mix based on the label
- Colors should be rich and visible but not garish. Think luxury event lighting.
- gradient opacity should be 0.4-0.6 for visible impact
- particle count should be 35-50 for density
- The base background is #FAF5F0 warm off-white`;

    // Try up to 3 keys
    for (let attempt = 0; attempt < Math.min(3, GROQ_KEYS.length); attempt++) {
      const key = getNextKey();
      const text = await callGroq(key, [
        { role: "system", content: "You are a JSON API. Return ONLY valid JSON objects. No markdown. No explanations. No code fences. No thinking tags." },
        { role: "user", content: prompt },
      ]);

      if (text) {
        // Strip any thinking tags from Qwen
        const cleaned = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const theme = JSON.parse(jsonMatch[0]);
            // Validate essential fields exist
            if (theme.gradient && theme.particles && theme.ambience) {
              themeCache.set(cacheKey, theme);
              return NextResponse.json(theme);
            }
          } catch {
            // Parse failed, try next key
          }
        }
      }
    }

    // All attempts failed
    console.error("All Groq attempts failed, using fallback");
    return NextResponse.json(FALLBACK_THEME);
  } catch (error) {
    console.error("Theme generation error:", error);
    return NextResponse.json(FALLBACK_THEME);
  }
}
