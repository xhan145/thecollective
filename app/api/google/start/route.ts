import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  authErrorRedirect,
  buildGoogleAuthUrl,
  getAppOrigin,
  getGoogleRedirectUri,
  isGoogleAuthConfigured,
  newOAuthNonce,
} from "@/lib/googleAuth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!isGoogleAuthConfigured()) {
    return authErrorRedirect(req, "google_not_configured");
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const invite = searchParams.get("invite")?.trim() || undefined;
  const nonce = newOAuthNonce();
  const origin = getAppOrigin(req);
  const url = buildGoogleAuthUrl({ mode, invite, nonce }, getGoogleRedirectUri(origin));

  const res = NextResponse.redirect(url);
  const cookieStore = await cookies();
  cookieStore.set("google_oauth_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
