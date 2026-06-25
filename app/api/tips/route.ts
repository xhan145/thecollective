import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/serverAuth";
import { contentSafetyPrecheck } from "@/lib/safety/contentSafety";
import { assertBrandSafe } from "@/lib/ai/outputPolicy";
import { mapTip } from "@/lib/supabase/tipsRepository";

export const runtime = "nodejs";

async function aiFlagged(body: string): Promise<boolean> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return false; // graceful: regex still applied
  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "omni-moderation-latest", input: body }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    return !!json.results?.[0]?.flagged;
  } catch { return false; }
}

export async function POST(req: Request) {
  const service = getSupabaseServiceClient();
  if (!service) return NextResponse.json({ error: "Server is not configured." }, { status: 500 });
  const user = await getAuthedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { promptId, body } = (await req.json()) as { promptId?: string; body?: string };
  const text = (body ?? "").trim();
  if (!promptId || !text) return NextResponse.json({ error: "Missing tip." }, { status: 400 });
  if (text.length > 280) return NextResponse.json({ error: "Tips are 280 characters or fewer." }, { status: 400 });

  const gate = contentSafetyPrecheck(text);
  if (!gate.ok) return NextResponse.json({ error: "Let's keep tips to your practice — no private details or harsh wording." }, { status: 400 });
  try { assertBrandSafe([text]); } catch { return NextResponse.json({ error: "Let's keep tips practical and kind." }, { status: 400 }); }
  if (await aiFlagged(text)) return NextResponse.json({ error: "That tip didn't pass our safety check. Try rephrasing." }, { status: 400 });

  // submit_tip enforces the author gate + credits; call it as the user (RLS-respecting) via a user-scoped client
  // is not available here, so use service role but pass the user id through the SECURITY DEFINER fn which reads auth.uid().
  // The fn uses auth.uid(); with the service client there is no auth.uid(), so insert directly here as service role,
  // replicating the author-gate check, then credit via RPC-less path:
  const { data: done } = await service.from("practice_completions").select("user_id").eq("user_id", user.id).eq("prompt_id", promptId).limit(1);
  const { data: pf } = done?.length ? { data: done } : await service.from("proofs").select("user_id").eq("user_id", user.id).eq("prompt_id", promptId).limit(1);
  if (!pf?.length) return NextResponse.json({ error: "Complete the practice before sharing a tip." }, { status: 403 });

  const { data: tip, error } = await service.from("practice_tips").insert({ prompt_id: promptId, author_id: user.id, body: text }).select("*").single();
  if (error || !tip) return NextResponse.json({ error: "Could not save tip." }, { status: 500 });
  // capped submit credit via the existing internal helper (service role can call it)
  try { await service.rpc("record_tip_submit_trust", { p_tip_id: tip.id, p_uid: user.id }); } catch { /* best-effort */ }
  return NextResponse.json({ tip: mapTip(tip) }, { status: 201 });
}
