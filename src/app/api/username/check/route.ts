import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim().toLowerCase();

  if (!username || username.length < 2) {
    return NextResponse.json({ available: false, reason: "Username must be at least 2 characters" });
  }

  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    return NextResponse.json({ available: false, reason: "Only letters, numbers, underscores, dots, and hyphens" });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .limit(1);

  // If the only match is the current user, it's still available (they're keeping their own)
  const taken = data && data.length > 0 && data[0].id !== user?.id;

  return NextResponse.json({ available: !taken });
}
