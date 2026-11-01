import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Get the Google provider token — try session first, then cookie fallback
  const { data: { session } } = await supabase.auth.getSession();
  const cookieStore = await cookies();
  const providerToken = session?.provider_token || cookieStore.get("google_provider_token")?.value;

  if (!providerToken) {
    return NextResponse.json({ error: "No Google token — sign in with Google to use Find Contacts" }, { status: 400 });
  }

  try {
    // Fetch Google contacts (People API)
    const res = await fetch(
      "https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,photos&pageSize=500",
      { headers: { Authorization: `Bearer ${providerToken}` } }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Google People API error:", res.status, errText);
      // If token is invalid/expired, tell user to re-auth
      if (res.status === 401 || res.status === 403) {
        return NextResponse.json({ error: "No Google token — sign in with Google to use Find Contacts" }, { status: 400 });
      }
      return NextResponse.json({ error: `Google API error (${res.status})` }, { status: 502 });
    }

    const data = await res.json();
    const connections = data.connections || [];

    // Extract emails from contacts
    const contactEmails: { name: string; email: string; photo?: string }[] = [];
    for (const person of connections) {
      const emails = person.emailAddresses || [];
      const name = person.names?.[0]?.displayName || "";
      const photo = person.photos?.[0]?.url;
      for (const e of emails) {
        if (e.value) {
          contactEmails.push({ name, email: e.value.toLowerCase(), photo });
        }
      }
    }

    if (contactEmails.length === 0) {
      return NextResponse.json({ contacts: 0, matched: [], notOnApp: [] });
    }

    // Try to match against profiles table — but don't fail if table doesn't exist
    let matched: typeof contactEmails = [];
    let notOnApp: typeof contactEmails = [...contactEmails];

    try {
      const { data: matchedProfiles } = await supabase
        .from("profiles")
        .select("id, name, username, first_name, last_name, extras")
        .limit(500);

      if (matchedProfiles && matchedProfiles.length > 0) {
        const profileNames = new Set(
          matchedProfiles.map((p) => p.name?.toLowerCase()).filter(Boolean)
        );
        const profileUsernames = new Set(
          matchedProfiles.map((p) => p.username?.toLowerCase()).filter(Boolean)
        );

        matched = [];
        notOnApp = [];
        for (const contact of contactEmails) {
          const nameMatch = profileNames.has(contact.name.toLowerCase()) ||
            profileUsernames.has(contact.name.toLowerCase().replace(/\s/g, ""));
          if (nameMatch) {
            matched.push(contact);
          } else {
            notOnApp.push(contact);
          }
        }
      }
    } catch {
      // Profiles table might not exist — skip matching, show all as invite
      console.warn("Profiles query failed — skipping matching");
    }

    // Clear the one-time cookie after successful use
    const response = NextResponse.json({
      contacts: contactEmails.length,
      matched,
      notOnApp: notOnApp.slice(0, 50),
    });
    response.cookies.delete("google_provider_token");
    return response;
  } catch (err) {
    console.error("Contacts fetch error:", err);
    return NextResponse.json({ error: "Failed to process contacts" }, { status: 500 });
  }
}
