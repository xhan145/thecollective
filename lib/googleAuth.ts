import crypto from "crypto";

export type GoogleOAuthState = {
  mode: "login" | "signup";
  invite?: string;
  nonce: string;
};

export function isGoogleAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_WEB_CLIENT_ID &&
      process.env.GOOGLE_WEB_CLIENT_SECRET &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getAppOrigin(req?: Request): string {
  // Prefer the host the request actually arrived on so the whole OAuth round-trip
  // (start → Google → callback → google-complete) stays on a single origin. The
  // CSRF nonce cookie is host-only, so pinning to NEXT_PUBLIC_APP_URL broke sign-in
  // whenever the app is served from a different domain (e.g. joincollective.net)
  // than the env value (the vercel.app URL): the nonce set on the user's domain
  // never reached the cross-domain callback. NEXT_PUBLIC_APP_URL is only a fallback
  // for contexts without a request (e.g. local scripts).
  if (req) {
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    if (host) {
      const proto = req.headers.get("x-forwarded-proto") || "https";
      return `${proto}://${host}`;
    }
    try {
      return new URL(req.url).origin;
    } catch {
      // fall through to the env/default below
    }
  }
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function getGoogleRedirectUri(origin?: string): string {
  const base = origin ?? getAppOrigin();
  return `${base.replace(/\/$/, "")}/api/google/callback`;
}

export function encodeOAuthState(state: GoogleOAuthState): string {
  return Buffer.from(JSON.stringify(state)).toString("base64url");
}

export function decodeOAuthState(raw: string | null): GoogleOAuthState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as GoogleOAuthState;
    if (parsed.mode !== "login" && parsed.mode !== "signup") return null;
    if (typeof parsed.nonce !== "string" || !parsed.nonce) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function newOAuthNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function buildGoogleAuthUrl(state: GoogleOAuthState, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_WEB_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state: encodeOAuthState(state),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function authErrorRedirect(req: Request, code: string, detail?: string): Response {
  const url = new URL("/auth", getAppOrigin(req));
  url.searchParams.set("error", code);
  if (detail) url.searchParams.set("detail", detail.slice(0, 180));
  return Response.redirect(url);
}

/** First name (or first token of full name) from a Google ID token payload. */
export function googleDisplayNameFromIdToken(idToken: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(idToken.split(".")[1], "base64url").toString("utf8"));
    if (typeof payload.given_name === "string" && payload.given_name.trim()) {
      return payload.given_name.trim();
    }
    if (typeof payload.name === "string" && payload.name.trim()) {
      const full = payload.name.trim();
      return full.split(/\s+/)[0] || full;
    }
  } catch {
    /* ignore malformed token */
  }
  return null;
}

export function profileInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const compact = displayName.replace(/\s+/g, "");
  return (compact.slice(0, 2) || "M").toUpperCase();
}
