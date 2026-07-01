import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import {
  authErrorRedirect,
  decodeOAuthState,
  getAppOrigin,
  getGoogleRedirectUri,
  googleDisplayNameFromIdToken,
  isGoogleAuthConfigured,
  profileInitials,
} from "@/lib/googleAuth";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type GoogleTokenResponse = {
  id_token?: string;
  error?: string;
  error_description?: string;
};

async function exchangeGoogleCode(code: string, redirectUri: string): Promise<GoogleTokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_WEB_CLIENT_ID!,
      client_secret: process.env.GOOGLE_WEB_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  return res.json() as Promise<GoogleTokenResponse>;
}

function completeRedirect(origin: string, session: { access_token: string; refresh_token: string }, nextPath: string) {
  const url = new URL("/auth/google-complete", origin);
  const hash = new URLSearchParams({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    token_type: "bearer",
    next: nextPath,
  });
  url.hash = hash.toString();
  return Response.redirect(url.toString());
}

export async function GET(req: Request) {
  if (!isGoogleAuthConfigured()) {
    return authErrorRedirect(req, "google_not_configured");
  }

  const { searchParams } = new URL(req.url);
  const oauthError = searchParams.get("error");
  if (oauthError) {
    return authErrorRedirect(req, "google_denied", oauthError);
  }

  const code = searchParams.get("code");
  const state = decodeOAuthState(searchParams.get("state"));
  const cookieStore = await cookies();
  const expectedNonce = cookieStore.get("google_oauth_nonce")?.value;
  cookieStore.delete("google_oauth_nonce");

  if (!code || !state || !expectedNonce || state.nonce !== expectedNonce) {
    return authErrorRedirect(req, "google_state_invalid");
  }

  const origin = getAppOrigin(req);
  const redirectUri = getGoogleRedirectUri(origin);
  const tokens = await exchangeGoogleCode(code, redirectUri);
  if (!tokens.id_token) {
    return authErrorRedirect(req, "google_token_failed", tokens.error_description || tokens.error);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: tokens.id_token,
  });

  if (error || !data.session) {
    return authErrorRedirect(req, "google_signin_failed", error?.message);
  }

  const user = data.user;
  const service = getSupabaseServiceClient();
  const requireInvite = process.env.NEXT_PUBLIC_REQUIRE_INVITE_CODE === "true";

  const displayName =
    googleDisplayNameFromIdToken(tokens.id_token) ??
    (typeof user.user_metadata?.given_name === "string" ? user.user_metadata.given_name.trim() : null);

  if (displayName && service) {
    await service
      .from("profiles")
      .update({ display_name: displayName, initials: profileInitials(displayName) })
      .eq("id", user.id);
  }

  if (state.mode === "signup" && state.invite) {
    await fetch(`${origin}/api/beta/redeem-invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session.access_token}`,
      },
      body: JSON.stringify({ code: state.invite }),
    }).catch(() => {});
  }

  let nextPath = "/home";
  if (service) {
    const { data: profile } = await service
      .from("profiles")
      .select("onboarding_completed, beta_access")
      .eq("id", user.id)
      .maybeSingle();

      console.log("User profile:", JSON.stringify(profile, null, 2));

    if (requireInvite && !profile?.beta_access) {
      nextPath = "/access";
    } else if (!profile?.onboarding_completed) {
      nextPath = "/onboarding";
    }

    if (state.mode === "signup") {
      await service
        .from("beta_events")
        .insert({ user_id: user.id, event_type: "signup_completed", route: "/auth", metadata: { provider: "google" } })
        .then(
          () => {},
          () => {},
        );
    }
  } else if (state.mode === "signup") {
    nextPath = requireInvite && !state.invite ? "/access" : "/onboarding";
  }

  return completeRedirect(origin, data.session, nextPath);
}
