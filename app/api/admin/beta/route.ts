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

  const { data: reportRows } = await service
    .from("tip_reports")
    .select("id, reason, created_at, practice_tips(id, body, author_id)")
    .order("created_at", { ascending: false })
    .limit(25);
  const reportedTips = (reportRows ?? []).map((r: any) => ({
    id: r.id, reason: r.reason ?? null, body: r.practice_tips?.body ?? "(deleted)", tipId: r.practice_tips?.id ?? null,
  }));

  const heldQuery = (table: string, authorCol: string) =>
    service.from(table).select(`id, ${authorCol}, body, created_at`).eq("held", true).order("created_at", { ascending: false }).limit(25);
  const [heldProofs, heldTips, heldFeedback] = await Promise.all([
    heldQuery("proofs", "user_id"), heldQuery("practice_tips", "author_id"), heldQuery("feedback", "author_id"),
  ]);
  const heldContent = [
    ...(heldProofs.data ?? []).map((r: any) => ({ kind: "proof" as const, id: r.id, authorId: r.user_id, body: r.body ?? "", createdAt: r.created_at })),
    ...(heldTips.data ?? []).map((r: any) => ({ kind: "tip" as const, id: r.id, authorId: r.author_id, body: r.body ?? "", createdAt: r.created_at })),
    ...(heldFeedback.data ?? []).map((r: any) => ({ kind: "feedback" as const, id: r.id, authorId: r.author_id, body: r.body ?? "", createdAt: r.created_at })),
  ];

  // Open member reports (040), grouped by target content.
  const { data: openReports } = await service
    .from("reports")
    .select("id, reporter_id, target_type, target_id, reason, severity, detail, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(200);
  const reportProofIds = [...new Set((openReports ?? []).filter((r: any) => r.target_type === "proof").map((r: any) => r.target_id))];
  const reportFbIds = [...new Set((openReports ?? []).filter((r: any) => r.target_type === "feedback").map((r: any) => r.target_id))];
  const [rpProofs, rpFb] = await Promise.all([
    reportProofIds.length ? service.from("proofs").select("id, title, body, user_id, moderation_status").in("id", reportProofIds) : Promise.resolve({ data: [] as any[] }),
    reportFbIds.length ? service.from("feedback").select("id, body, author_id, moderation_status").in("id", reportFbIds) : Promise.resolve({ data: [] as any[] }),
  ]);
  const proofById = new Map((rpProofs.data ?? []).map((p: any) => [p.id, p]));
  const fbById = new Map((rpFb.data ?? []).map((f: any) => [f.id, f]));
  const reportGroups = new Map<string, any>();
  for (const r of openReports ?? []) {
    const key = `${r.target_type}:${r.target_id}`;
    const tgt = r.target_type === "proof" ? proofById.get(r.target_id) : fbById.get(r.target_id);
    if (!tgt) continue; // target deleted
    let g = reportGroups.get(key);
    if (!g) {
      g = {
        key, targetType: r.target_type, targetId: r.target_id,
        kind: r.target_type, // maps to moderation RPC kind (proof|feedback)
        snippet: (r.target_type === "proof" ? (tgt.title ? `${tgt.title} — ${tgt.body ?? ""}` : tgt.body) : tgt.body) ?? "",
        authorName: nameById.get(r.target_type === "proof" ? tgt.user_id : tgt.author_id) ?? "Member",
        status: tgt.moderation_status ?? "clear",
        reporters: new Set<string>(), reasons: new Set<string>(), severity: "mild", latestAt: r.created_at,
      };
      reportGroups.set(key, g);
    }
    g.reporters.add(r.reporter_id);
    g.reasons.add(r.reason);
    if (r.severity === "severe") g.severity = "severe";
  }
  const reports = [...reportGroups.values()].map((g) => ({
    key: g.key, targetType: g.targetType, targetId: g.targetId, kind: g.kind,
    snippet: String(g.snippet).slice(0, 160), authorName: g.authorName, status: g.status,
    severity: g.severity, reasons: [...g.reasons], distinctReporters: g.reporters.size, latestAt: g.latestAt,
  })).sort((a, b) => (a.severity === b.severity ? b.distinctReporters - a.distinctReporters : a.severity === "severe" ? -1 : 1));

  return NextResponse.json({
    stats: {
      totalUsers, demoUsers, onboardedUsers, betaUsers,
      proofCount, demoProofCount, feedbackCount, appFeedbackCount,
      onboardingIncompleteCount: onboardingIncomplete.length,
      noProofCount: noProof.length,
    },
    reports,
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
    reportedTips,
    heldContent,
  });
}
