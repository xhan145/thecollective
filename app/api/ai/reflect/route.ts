import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { isValidMode, runReflection } from "@/lib/ai/reflect";

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  let body: { mode?: string; input?: string; proofId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const mode = body.mode ?? "";
  const input = (body.input ?? "").trim();
  if (!isValidMode(mode) || !input) {
    return NextResponse.json({ error: "Invalid mode or input" }, { status: 400 });
  }

  const result = await runReflection(mode, input);

  // Best-effort log; the helper must work even if this insert fails.
  await supabase.from("ai_reflections").insert({
    user_id: user.id,
    proof_id: body.proofId ?? null,
    mode,
    input: input.slice(0, 2000),
    output: result.output.slice(0, 4000),
  });

  return NextResponse.json({ output: result.output, source: result.source });
}
