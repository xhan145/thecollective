import { NextResponse } from "next/server";
import { requireSupabaseUser } from "@/lib/supabaseVoiceClient";
import { assertVoiceCoachEnabled, getSignedVoiceCoachUrl, loadVoiceCoachContext, toDynamicVariables } from "@/lib/voiceCoach/server";
import type { VoiceCoachSessionResponse } from "@/lib/voiceCoach/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireSupabaseUser(request);
    const context = await loadVoiceCoachContext(supabase, user);
    assertVoiceCoachEnabled(context);

    const signedUrl = await getSignedVoiceCoachUrl();
    const body: VoiceCoachSessionResponse = {
      signedUrl,
      dynamicVariables: toDynamicVariables(context)
    };

    return NextResponse.json(body);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Voice coach could not start." }, { status: 500 });
  }
}

