import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/auth?success=true";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // If redirecting to contacts, pass the Google provider token via a short-lived cookie
      // because Supabase doesn't persist provider_token across page loads
      if (next === "/contacts" && data.session?.provider_token) {
        const response = NextResponse.redirect(`${origin}/contacts?synced=1`);
        response.cookies.set("google_provider_token", data.session.provider_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 300, // 5 minutes — enough to call the contacts API
          path: "/",
        });
        return response;
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=auth_failed`);
}
