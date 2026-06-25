import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/serverAuth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const service = getSupabaseServiceClient();
  if (!service) return NextResponse.json({ error: "Server is not configured." }, { status: 500 });
  const user = await getAuthedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tipId, reason } = (await req.json()) as { tipId?: string; reason?: string };
  if (!tipId) return NextResponse.json({ error: "Missing tip." }, { status: 400 });
  await service.from("tip_reports").insert({ tip_id: tipId, reporter_id: user.id, reason: reason ?? null });
  return NextResponse.json({ ok: true });
}
