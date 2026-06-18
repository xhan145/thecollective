import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getAuthedUser, isAdminUser } from "@/lib/supabase/serverAuth";

export const runtime = "nodejs";

const STATUSES = ["new", "reviewing", "planned", "resolved", "dismissed"] as const;

/** Admin-only: update an app_feedback row's status. Service-role (server). */
export async function POST(req: Request) {
  const service = getSupabaseServiceClient();
  if (!service) return NextResponse.json({ error: "Server is not configured." }, { status: 500 });
  const user = await getAuthedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdminUser(service, user))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";
  const status = typeof body?.status === "string" ? body.status : "";
  if (!id || !STATUSES.includes(status as (typeof STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid id or status." }, { status: 400 });
  }

  const { error } = await service.from("app_feedback").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
