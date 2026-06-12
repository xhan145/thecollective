import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createUserIfMissing, isInvited } from "@/lib/supabase/auth";
import type { UserRole } from "@/lib/types";

/** Handles Supabase email-confirmation / magic-link redirects. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const role: UserRole = searchParams.get("role") === "artist" ? "artist" : "scout";

  if (code) {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      await createUserIfMissing(data.user.id, data.user.email ?? null, role);
      const invited = await isInvited(data.user.email ?? null);
      if (!invited) return NextResponse.redirect(`${origin}/waitlist`);
      const dest = role === "artist" ? "/artist/onboarding" : "/scout/onboarding";
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }
  return NextResponse.redirect(`${origin}/auth?mode=signin`);
}
