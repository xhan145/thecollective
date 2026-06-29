import { NextResponse } from "next/server";
import { requireSupabaseUser } from "@/lib/supabaseVoiceClient";
import { runVoiceCoachTool } from "@/lib/voiceCoach/server";
import type { VoiceCoachToolRequest } from "@/lib/voiceCoach/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireSupabaseUser(request);
    const body = (await request.json()) as VoiceCoachToolRequest;

    if (!body.tool) {
      return NextResponse.json({ ok: false, error: "Missing voice coach tool." });
    }

    const result = await runVoiceCoachTool(supabase, user, body.tool, body.params || {});
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ ok: false, error: "The coach could not reach progress right now." });
  }
}

