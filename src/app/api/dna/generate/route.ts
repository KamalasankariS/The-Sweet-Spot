import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { analyzeTaste, buildLLMPrompt } from "@/lib/tasteEngine";

const anthropic = new Anthropic();

export async function POST(request: Request) {
  try {
    const { selections, variation } = await request.json();

    if (!selections || typeof selections !== "object") {
      return NextResponse.json({ error: "Invalid selections" }, { status: 400 });
    }

    // Deterministic analysis
    const analysis = analyzeTaste(selections);

    // If no API key, return deterministic fallbacks
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        ...analysis,
        source: "fallback",
      });
    }

    // Generate personalized descriptions via Claude
    const prompt = buildLLMPrompt(analysis, variation);

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      temperature: 1,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse the JSON from Claude's response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ ...analysis, source: "fallback" });
    }

    const generated = JSON.parse(jsonMatch[0]);

    // Merge LLM descriptions into the deterministic analysis
    return NextResponse.json({
      ...analysis,
      archetype: {
        ...analysis.archetype,
        tagline: generated.archetypeTagline || analysis.archetype.tagline,
        description: generated.archetypeDescription || analysis.archetype.description,
      },
      aesthetic: generated.aesthetic || analysis.aesthetic,
      categoryInsights: {
        music: {
          label: generated.categoryInsights?.music || analysis.categoryInsights.music.label,
          color: analysis.categoryInsights.music.color,
        },
        film: {
          label: generated.categoryInsights?.film || analysis.categoryInsights.film.label,
          color: analysis.categoryInsights.film.color,
        },
        dining: {
          label: generated.categoryInsights?.dining || analysis.categoryInsights.dining.label,
          color: analysis.categoryInsights.dining.color,
        },
        nightlife: {
          label: generated.categoryInsights?.nightlife || analysis.categoryInsights.nightlife.label,
          color: analysis.categoryInsights.nightlife.color,
        },
        style: {
          label: generated.categoryInsights?.style || analysis.categoryInsights.style.label,
          color: analysis.categoryInsights.style.color,
        },
      },
      source: "llm",
    });
  } catch (error) {
    console.error("DNA generation error:", error);

    // Fallback to deterministic analysis on any error
    try {
      const { selections } = await request.clone().json();
      const analysis = analyzeTaste(selections);
      return NextResponse.json({ ...analysis, source: "fallback" });
    } catch {
      return NextResponse.json({ error: "Failed to generate DNA" }, { status: 500 });
    }
  }
}
