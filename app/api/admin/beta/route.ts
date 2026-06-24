import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getAuthedUser, isAdminUser } from "@/lib/supabase/serverAuth";

export const runtime = "nodejs";

/** Admin-only beta stats + recent activity. Service-role (server). */
export async function GET(req: Request) {
  const service = getSupabaseServiceClient();
  if (!service) return NextResponse.json({ error: "Server is not configured." }, { status: 500 });
  const user = await getAuthedUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isAdminUser(service, user))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const count = async (table: string, fn?: (q: any) => any) => {
    let q = service.from(table).select("id", { count: "exact", head: true });
    if (fn) q = fn(q);
    const { count: c } = await q;
    return c ?? 0;
  };

  const [
    totalUsers, demoUsers, onboardedUsers, betaUsers,
    proofCount, demoProofCount, feedbackCount, appFeedbackCount,
  ] = await Promise.all([
    count("profiles", (q) => q.eq("is_demo", false)),
    count("profiles", (q) => q.eq("is_demo", true)),
    count("profiles", (q) => q.eq("is_demo", false).eq("onboarding_completed", true)),
    count("profiles", (q) => q.eq("beta_access", true)),
    count("proofs", (q) => q.eq("is_demo", false)),
    count("proofs", (q) => q.eq("is_demo", true)),
    count("feedback", (q) => q.eq("is_demo", false)),
    count("app_feedback"),
  ]);

  // Names for display.
  const { data: profileRows } = await service
    .from("profiles")
    .select("id, display_name, username, onboarding_completed, is_demo, created_at");
  const nameById = new Map<string, string>();
  for (const p of profileRows ?? []) nameById.set(p.id, p.display_name || p.username || p.id.slice(0, 8));

  // Real proof owner ids (to find signed-up-no-proof).
  const { data: realProofs } = await service
    .from("proofs")
    .select("id, user_id, title, media_type, created_at, is_demo")
    .eq("is_demo", false)
    .order("created_at", { ascending: false })
    .limit(15);
  const proofOwners = new Set((realProofs ?? []).map((p) => p.user_id));

  const realProfiles = (profileRows ?? []).filter((p) => !p.is_demo);
  const onboardingIncomplete = realProfiles
    .filter((p) => !p.onboarding_completed)
    .map((p) => ({ id: p.id, name: nameById.get(p.id), createdAt: p.created_at }));
  const noProof = realProfiles
    .filter((p) => !proofOwners.has(p.id))
    .map((p) => ({ id: p.id, name: nameById.get(p.id), createdAt: p.created_at }));

  const { data: appFeedback } = await service
    .from("app_feedback")
    .select("id, user_id, category, rating, route, body, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: spamRows } = await service
    .from("profiles")
    .select("id, display_name, username, spam_signal, is_demo")
    .gt("spam_signal", 0)
    .order("spam_signal", { ascending: false })
    .limit(25);
  const spamReview = (spamRows ?? []).map((r: any) => ({
    id: r.id, name: r.display_name || r.username || r.id, spamSignal: r.spam_signal ?? 0, isDemo: !!r.is_demo,
  }));

  return NextResponse.json({
    stats: {
      totalUsers, demoUsers, onboardedUsers, betaUsers,
      proofCount, demoProofCount, feedbackCount, appFeedbackCount,
      onboardingIncompleteCount: onboardingIncomplete.length,
      noProofCount: noProof.length,
    },
    recentProofs: (realProofs ?? []).map((p) => ({
      id: p.id, name: nameById.get(p.user_id), title: p.title, mediaType: p.media_type, createdAt: p.created_at,
    })),
    appFeedback: (appFeedback ?? []).map((f) => ({
      id: f.id, name: nameById.get(f.user_id) ?? "Unknown", category: f.category,
      rating: f.rating, route: f.route, body: f.body, status: f.status ?? "new", createdAt: f.created_at,
    })),
    onboardingIncomplete,
    noProof,
    spamReview,
  });
}
