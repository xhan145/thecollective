import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/serverAuth";

export const runtime = "nodejs";

// Self-serve account deletion (R9). Soft-delete: the delete_own_account RPC
// anonymizes the profile + removes solo personal data and 'clear' content while
// retaining moderation evidence + audit (046); we then ban the auth user so they
// cannot sign back in (the auth row is kept so retained evidence survives — a
// hard delete would cascade via profiles). The client signs out afterward.
export async function POST(req: Request) {
  const user = await getAuthedUser(req);
  if (!user) return NextResponse.json({ ok: false, error: "Please sign in first." }, { status: 401 });

  const service = getSupabaseServiceClient();
  if (!service) return NextResponse.json({ ok: false, error: "Server is not configured." }, { status: 500 });

  const { data: ok, error } = await service.rpc("delete_own_account", { p_user_id: user.id });
  if (error || ok !== true) return NextResponse.json({ ok: false, error: "Could not delete the account." }, { status: 500 });

  // Block re-login. ~100 years; keeps the (anonymized) auth+profile row intact.
  await service.auth.admin.updateUserById(user.id, { ban_duration: "876000h" }).catch(() => {});

  return NextResponse.json({ ok: true });
}
