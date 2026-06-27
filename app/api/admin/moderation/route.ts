import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getAuthedUser, isAdminUser } from "@/lib/supabase/serverAuth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const service = getSupabaseServiceClient();
  if (!service) return NextResponse.json({ error: "Server is not configured." }, { status: 500 });
  const user = await getAuthedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdminUser(service, user))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action, kind, id } = (await req.json()) as { action?: string; kind?: string; id?: string };
  if (!id || (kind !== "proof" && kind !== "tip" && kind !== "feedback")) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  const fn = action === "remove" ? "remove_content" : action === "clear" ? "clear_content" : null;
  if (!fn) return NextResponse.json({ error: "Bad action." }, { status: 400 });
  const { error } = await service.rpc(fn, { p_kind: kind, p_id: id });
  if (error) return NextResponse.json({ error: "Action failed." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
