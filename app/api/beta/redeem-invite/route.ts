import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/serverAuth";

export const runtime = "nodejs";

const BAD = "That invite code did not work. Check the code or ask for a new one.";

/**
 * Validate + redeem a beta invite code for the authenticated user.
 * Service-role only (server). Invite codes are a controlled beta gate, not a
 * high-security secret. Body: { code: string }.
 */
export async function POST(req: Request) {
  const user = await getAuthedUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "Please sign in first." }, { status: 401 });

  const service = getSupabaseServiceClient();
  if (!service) return NextResponse.json({ ok: false, error: "Server is not configured." }, { status: 500 });

  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!code) return NextResponse.json({ ok: false, error: BAD }, { status: 400 });

  const { data: invite } = await service
    .from("beta_invites")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  const now = Date.now();
  const valid =
    invite &&
    invite.status === "active" &&
    (!invite.expires_at || new Date(invite.expires_at).getTime() > now) &&
    invite.use_count < invite.max_uses &&
    (!invite.email || (user.email && invite.email.toLowerCase() === user.email.toLowerCase()));

  if (!valid) return NextResponse.json({ ok: false, error: BAD }, { status: 400 });

  // Atomic-ish redemption: only succeeds while a use remains.
  const nextCount = invite.use_count + 1;
  const { data: claimed } = await service
    .from("beta_invites")
    .update({
      use_count: nextCount,
      status: nextCount >= invite.max_uses ? "used" : "active",
    })
    .eq("id", invite.id)
    .lt("use_count", invite.max_uses)
    .select("id")
    .maybeSingle();

  if (!claimed) return NextResponse.json({ ok: false, error: BAD }, { status: 400 });

  await service
    .from("profiles")
    .update({ beta_access: true, invite_code: code, beta_joined_at: new Date().toISOString() })
    .eq("id", user.id);

  await service
    .from("beta_events")
    .insert({ user_id: user.id, event_type: "invite_validated", route: "/access", metadata: { code } })
    .then(() => {}, () => {});

  return NextResponse.json({ ok: true });
}
