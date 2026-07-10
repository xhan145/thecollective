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

  // Atomic redemption (R27): validation + single-statement increment + the
  // beta_access grant all happen inside one SECURITY DEFINER transaction, so a
  // capped invite can never be over-redeemed under concurrent requests.
  const { data: ok, error } = await service.rpc("redeem_beta_invite", {
    p_code: code,
    p_user_id: user.id,
    p_email: user.email ?? null,
  });
  if (error || ok !== true) return NextResponse.json({ ok: false, error: BAD }, { status: 400 });

  await service
    .from("beta_events")
    .insert({ user_id: user.id, event_type: "invite_validated", route: "/access", metadata: { code } })
    .then(() => {}, () => {});

  return NextResponse.json({ ok: true });
}
