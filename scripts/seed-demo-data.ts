/**
 * Collective — second-tier demo population seed.
 *
 * Creates a realistic, beginner-safe demo ecosystem in Supabase so closed-beta
 * demos and screenshots feel alive. Every row is tagged is_demo=true and
 * demo_cohort='second-tier-demo-v1' so it is identifiable and cleanly removable.
 *
 * Usage:
 *   npm run seed:demo:dry      # plan only, no writes, no key required
 *   npm run seed:demo          # create demo users + content (needs service key + ALLOW_DEMO_SEED/--yes)
 *   npm run seed:demo:reset    # delete ONLY demo data (never real users/content)
 *   npm run seed:demo:media    # (re)generate/upload media only
 *
 * Safety:
 *   - Requires SUPABASE_SERVICE_ROLE_KEY (server-only; never NEXT_PUBLIC).
 *   - Refuses to run without ALLOW_DEMO_SEED=true OR --yes. In production needs BOTH.
 *   - --reset deletes only is_demo rows + demo+*@collective.local auth users.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import {
  buildPersonas, DEMO_COHORT, DEMO_CONTRIBUTION_FOCUS, DEMO_OPEN_PROOFS, DIRECTIONS,
  FEEDBACK_NOTES, FEEDBACK_REQUEST_OPENERS,
  mulberry32, PEER_NOTE_OPENERS, PEER_REPLIES, pickProofKind, PROOF_TEMPLATES, SIZES,
  USEFUL_REASONS, type Persona, type SizeName
} from "./demo/shared";

loadEnv({ path: ".env.local" });
loadEnv();

const args = process.argv.slice(2);
const has = (f: string) => args.includes(f);
const DRY = has("--dry-run");
const RESET = has("--reset");
const MEDIA_ONLY = has("--media-only");
const YES = has("--yes");

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || "";
const ALLOW = process.env.ALLOW_DEMO_SEED === "true";
const IS_PROD = process.env.NODE_ENV === "production";
const SIZE = (process.env.DEMO_SEED_SIZE as SizeName) || "standard";
const UPLOAD_STORAGE = process.env.DEMO_UPLOAD_TO_STORAGE === "true";
const BUCKET = "collective-proof-media";
const DAY = 86_400_000;

function log(...a: unknown[]) {
  console.log(...a);
}

function planCounts() {
  const s = SIZES[SIZE] ?? SIZES.standard;
  return s;
}

function assertWriteAllowed() {
  if (!URL || !SERVICE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Service role key is required for writes.");
  }
  const consented = ALLOW || YES;
  if (!consented) {
    throw new Error("Refusing to run. Set ALLOW_DEMO_SEED=true or pass --yes.");
  }
  if (IS_PROD && !(ALLOW && YES)) {
    throw new Error("Production requires BOTH ALLOW_DEMO_SEED=true AND --yes.");
  }
}

function admin(): SupabaseClient {
  return createClient(URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
}

function mediaKindFor(kind: string): string {
  if (kind === "video") return "video_placeholder";
  if (kind === "audio") return "audio_placeholder";
  if (kind === "image") return "image";
  return "text";
}

// ---------------- reset ----------------

async function listDemoAuthUsers(sb: SupabaseClient): Promise<{ id: string; email: string }[]> {
  const out: { id: string; email: string }[] = [];
  let page = 1;
  for (;;) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const users = data.users ?? [];
    for (const u of users) {
      if ((u.email ?? "").startsWith("demo+") && (u.email ?? "").endsWith("@collective.local")) {
        out.push({ id: u.id, email: u.email! });
      }
    }
    if (users.length < 200) break;
    page += 1;
  }
  return out;
}

async function reset(sb: SupabaseClient) {
  log("Resetting demo data (is_demo = true only)...");
  // Demo proof ids first (for attachment cleanup + storage).
  const { data: demoProofs } = await sb.from("proofs").select("id").eq("is_demo", true);
  const proofIds = (demoProofs ?? []).map((r: any) => r.id);

  if (proofIds.length) {
    await sb.from("proof_attachments").delete().in("proof_id", proofIds);
  }
  // Engagement children first (FK-safe; all demo-scoped).
  await sb.from("messages").delete().eq("is_demo", true);
  await sb.from("conversations").delete().eq("is_demo", true);
  await sb.from("useful_marks").delete().eq("is_demo", true);
  await sb.from("saved_items").delete().eq("is_demo", true);
  await sb.from("member_connections").delete().eq("is_demo", true);
  await sb.from("contributions").delete().eq("is_demo", true);
  await sb.from("feedback").delete().eq("is_demo", true);
  await sb.from("trust_events").delete().eq("is_demo", true);
  await sb.from("proofs").delete().eq("is_demo", true);
  await sb.from("practice_completions").delete().eq("is_demo", true);
  await sb.from("app_feedback").delete().eq("is_demo", true);
  await sb.from("profiles").delete().eq("is_demo", true);

  const authUsers = await listDemoAuthUsers(sb);
  for (const u of authUsers) {
    await sb.auth.admin.deleteUser(u.id);
  }

  if (UPLOAD_STORAGE) {
    const prefix = `demo/${DEMO_COHORT}`;
    const { data: files } = await sb.storage.from(BUCKET).list(prefix, { limit: 1000 });
    if (files?.length) {
      await sb.storage.from(BUCKET).remove(files.map((f) => `${prefix}/${f.name}`));
    }
  }

  log(`Reset complete. Removed ${proofIds.length} demo proofs, ${authUsers.length} demo auth users, and related demo rows.`);
}

// ---------------- seed ----------------

async function loadContent(sb: SupabaseClient) {
  const { data: dirs, error: de } = await sb.from("directions").select("id, slug").eq("is_active", true);
  const { data: pracs, error: pe } = await sb.from("practices").select("id, direction_id").eq("is_active", true);
  if (de || pe || !dirs?.length || !pracs?.length) {
    throw new Error("directions/practices not found. Run migrations 013–015 first.");
  }
  const dirBySlug = new Map<string, string>();
  for (const d of dirs) dirBySlug.set(d.slug, d.id);
  const practicesByDir = new Map<string, string[]>();
  for (const p of pracs) {
    const list = practicesByDir.get(p.direction_id) ?? [];
    list.push(p.id);
    practicesByDir.set(p.direction_id, list);
  }
  return { dirBySlug, practicesByDir };
}

async function ensureDemoUser(
  sb: SupabaseClient,
  existing: Map<string, string>,
  persona: Persona,
): Promise<string | null> {
  const email = `demo+${persona.username}@collective.local`;
  const known = existing.get(email);
  if (known) return known;
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD || `demo-${persona.username}-pw1`,
    email_confirm: true,
    user_metadata: {
      display_name: persona.displayName,
      username: persona.username,
      is_demo: true,
      demo_persona: persona.persona
    }
  });
  if (error || !data.user) {
    log(`  ! could not create ${email}: ${error?.message ?? "unknown"}`);
    return null;
  }
  return data.user.id;
}

async function seed(sb: SupabaseClient) {
  const counts = planCounts();
  const rng = mulberry32(20260611);
  const now = Date.now();
  const { dirBySlug, practicesByDir } = await loadContent(sb);

  const personas = buildPersonas(counts.profiles);
  const existingAuth = new Map<string, string>();
  for (const u of await listDemoAuthUsers(sb)) existingAuth.set(u.email, u.id);

  // 1) Users + profiles
  log(`Creating/with ${personas.length} demo members...`);
  const userIds: { persona: Persona; id: string; directionId: string }[] = [];
  for (const persona of personas) {
    const id = await ensureDemoUser(sb, existingAuth, persona);
    if (!id) continue;
    const directionId = dirBySlug.get(persona.directionSlug) ?? dirBySlug.get("confident-communication")!;
    await sb.from("profiles").update({
      display_name: persona.displayName,
      username: persona.username,
      initials: persona.initials,
      bio: persona.bio,
      avatar_url: `/demo/avatars/${persona.username}.jpg`,
      current_direction_id: directionId,
      onboarding_completed: true,
      is_demo: true,
      demo_persona: persona.persona,
      demo_cohort: DEMO_COHORT,
      demo_sort_order: persona.sortOrder,
      demo_avatar_seed: persona.username,
      updated_at: new Date().toISOString()
    }).eq("id", id);
    userIds.push({ persona, id, directionId });
  }

  // 2) Proofs
  log(`Creating ~${counts.proofs} demo proofs...`);
  const proofs: { id: string; ownerId: string; directionId: string }[] = [];
  for (let i = 0; i < counts.proofs; i++) {
    const owner = userIds[i % userIds.length];
    if (!owner) break;
    const kind = pickProofKind(rng);
    const tmplPool = PROOF_TEMPLATES.filter((t) => t.directionSlug === owner.persona.directionSlug);
    const tmpl = tmplPool[Math.floor(rng() * tmplPool.length)] ?? PROOF_TEMPLATES[0];
    const assetN = Math.floor(rng() * 8);
    const mediaUrl = `/demo/proof/${kind}-${assetN}.jpg`;
    const practiceList = practicesByDir.get(owner.directionId) ?? [];
    const practiceId = practiceList.length ? practiceList[Math.floor(rng() * practiceList.length)] : null;
    const createdAt = new Date(now - Math.floor(rng() * 45) * DAY - Math.floor(rng() * DAY)).toISOString();
    const seedId = `demo-proof-${i}`;
    const { data, error } = await sb.from("proofs").upsert({
      user_id: owner.id,
      prompt_id: practiceId,
      direction_id: owner.directionId,
      title: tmpl.title,
      body: tmpl.caption,
      media_type: tmpl.proofType,
      media_url: mediaUrl,
      thumbnail_url: mediaUrl,
      media_kind: mediaKindFor(kind),
      visibility: "cohort",
      status: "submitted",
      is_demo: true,
      demo_seed_id: seedId,
      demo_quality: "good",
      created_at: createdAt
    }, { onConflict: "demo_seed_id" }).select("id").single();
    if (!error && data) proofs.push({ id: data.id, ownerId: owner.id, directionId: owner.directionId });
  }

  // 3) Practice completions
  log(`Creating ~${counts.practiceLogs} demo practice completions...`);
  let pcMade = 0;
  for (const u of userIds) {
    const list = practicesByDir.get(u.directionId) ?? [];
    const take = Math.min(list.length, 1 + Math.floor(rng() * 3));
    for (let k = 0; k < take && pcMade < counts.practiceLogs; k++) {
      await sb.from("practice_completions")
        .upsert({ user_id: u.id, prompt_id: list[k], is_demo: true, demo_seed_id: `demo-pc-${pcMade}` }, { onConflict: "user_id,prompt_id" });
      pcMade++;
    }
  }

  // 4) Feedback (structured) on others' proofs
  log(`Creating ~${counts.feedback} demo feedback notes...`);
  const feedbackReceived = new Map<string, number>();
  for (let i = 0; i < counts.feedback && proofs.length > 1; i++) {
    const proof = proofs[Math.floor(rng() * proofs.length)];
    const author = userIds[Math.floor(rng() * userIds.length)];
    if (!author || author.id === proof.ownerId) continue;
    const clarity = FEEDBACK_NOTES.clarity[Math.floor(rng() * FEEDBACK_NOTES.clarity.length)];
    const useful = FEEDBACK_NOTES.useful[Math.floor(rng() * FEEDBACK_NOTES.useful.length)];
    const next = FEEDBACK_NOTES.nextStep[Math.floor(rng() * FEEDBACK_NOTES.nextStep.length)];
    await sb.from("feedback").upsert({
      proof_id: proof.id,
      author_id: author.id,
      recipient_id: proof.ownerId,
      body: `What was clear: ${clarity}\nWhat could be improved: ${useful}\nOne useful next step: ${next}`,
      tone: "specific",
      helpful: rng() > 0.5,
      clarity_note: clarity,
      useful_note: useful,
      next_step_note: next,
      is_demo: true,
      demo_seed_id: `demo-fb-${i}`
    }, { onConflict: "demo_seed_id" });
    feedbackReceived.set(proof.ownerId, (feedbackReceived.get(proof.ownerId) ?? 0) + 1);
  }

  // 4c) Contributions (Phase B): open a few proofs + one accepted contribution each.
  log(`Opening ${DEMO_OPEN_PROOFS} demo proofs for contributions...`);
  for (const op of proofs.slice(0, DEMO_OPEN_PROOFS)) {
    await sb.from("proofs").update({ open_for_contributions: true, contribution_focus: DEMO_CONTRIBUTION_FOCUS }).eq("id", op.id);
    const contributor = userIds.find((u) => u.id !== op.ownerId);
    if (!contributor) continue;
    await sb.from("contributions").upsert({
      proof_id: op.id,
      contributor_id: contributor.id,
      owner_id: op.ownerId,
      observation: "The opening states the point before the detail — that lands well.",
      next_step: "Try cutting the second sentence so the first idea stands alone.",
      status: "accepted",
      accepted_at: new Date().toISOString(),
      is_demo: true,
      demo_seed_id: `demo-contribution-accepted-${op.id}`
    }, { onConflict: "demo_seed_id" });
  }

  // 4b) Useful marks (ranking signal; never own proof; one per user/target)
  log(`Creating ~${counts.usefulPerProof * proofs.length} demo useful marks...`);
  for (const proof of proofs) {
    const markers = new Set<string>();
    for (let k = 0; k < counts.usefulPerProof; k++) {
      const u = userIds[Math.floor(rng() * userIds.length)];
      if (!u || u.id === proof.ownerId || markers.has(u.id)) continue;
      markers.add(u.id);
      const reason = USEFUL_REASONS[Math.floor(rng() * USEFUL_REASONS.length)];
      await sb.from("useful_marks").upsert(
        { user_id: u.id, target_type: "proof", target_id: proof.id, reason, is_demo: true, demo_cohort: DEMO_COHORT, demo_seed_id: `demo-um-${proof.id}-${u.id}` },
        { onConflict: "user_id,target_id" }
      );
    }
  }

  // 4c) Saved items ("Save for practice")
  log(`Creating ~${counts.savedPerUser * userIds.length} demo saved items...`);
  for (const u of userIds) {
    const saved = new Set<string>();
    for (let k = 0; k < counts.savedPerUser; k++) {
      const proof = proofs[Math.floor(rng() * proofs.length)];
      if (!proof || proof.ownerId === u.id || saved.has(proof.id)) continue;
      saved.add(proof.id);
      await sb.from("saved_items").upsert(
        { user_id: u.id, target_type: "proof", target_id: proof.id, is_demo: true, demo_cohort: DEMO_COHORT, demo_seed_id: `demo-si-${u.id}-${proof.id}` },
        { onConflict: "user_id,target_type,target_id" }
      );
    }
  }

  // 4d) Learn-from connections (one-directional, same-direction biased, no self)
  log(`Creating ~${counts.learnFromPerUser * userIds.length} demo learn-from connections...`);
  for (const learner of userIds) {
    const sameDir = userIds.filter((t) => t.id !== learner.id && t.directionId === learner.directionId);
    const pool = sameDir.length >= counts.learnFromPerUser ? sameDir : userIds.filter((t) => t.id !== learner.id);
    const chosen = new Set<string>();
    for (let k = 0; k < counts.learnFromPerUser; k++) {
      const t = pool[Math.floor(rng() * pool.length)];
      if (!t || chosen.has(t.id)) continue;
      chosen.add(t.id);
      await sb.from("member_connections").upsert(
        { learner_id: learner.id, teacher_id: t.id, connection_type: "learn_from", status: "active", is_demo: true, demo_cohort: DEMO_COHORT, demo_seed_id: `demo-mc-${learner.id}-${t.id}` },
        { onConflict: "learner_id,teacher_id,connection_type" }
      );
    }
  }

  // 4e) Conversations + messages (peer notes / feedback requests; idempotent by demo_seed_id)
  log(`Creating ~${counts.conversations} demo peer-note / feedback-request threads...`);
  for (let i = 0; i < counts.conversations && proofs.length > 0; i++) {
    const proof = proofs[Math.floor(rng() * proofs.length)];
    const other = userIds[Math.floor(rng() * userIds.length)];
    if (!proof || !other || other.id === proof.ownerId) continue;
    const kind = i % 2 === 0 ? "feedback_request" : "peer_note";
    // feedback_request: owner asks `other`; peer_note: `other` notes the owner.
    const initiatorId = kind === "feedback_request" ? proof.ownerId : other.id;
    const recipientId = kind === "feedback_request" ? other.id : proof.ownerId;
    const convCreated = new Date(now - Math.floor(rng() * 45) * DAY).toISOString();
    const convSeed = `demo-conv-${i}`;
    const { data: conv } = await sb.from("conversations").upsert({
      kind,
      initiator_id: initiatorId,
      recipient_id: recipientId,
      proof_id: proof.id,
      subject: kind === "feedback_request" ? "Feedback request" : "Peer note",
      last_message_at: convCreated,
      is_demo: true,
      demo_cohort: DEMO_COHORT,
      demo_seed_id: convSeed,
      created_at: convCreated
    }, { onConflict: "demo_seed_id" }).select("id").single();
    if (!conv) continue;
    const opener = kind === "feedback_request"
      ? FEEDBACK_REQUEST_OPENERS[Math.floor(rng() * FEEDBACK_REQUEST_OPENERS.length)]
      : PEER_NOTE_OPENERS[Math.floor(rng() * PEER_NOTE_OPENERS.length)];
    const reply = PEER_REPLIES[Math.floor(rng() * PEER_REPLIES.length)];
    await sb.from("messages").upsert(
      { conversation_id: conv.id, sender_id: initiatorId, body: opener, is_demo: true, demo_seed_id: `${convSeed}-m1`, created_at: convCreated },
      { onConflict: "demo_seed_id" }
    );
    await sb.from("messages").upsert(
      { conversation_id: conv.id, sender_id: recipientId, body: reply, is_demo: true, demo_seed_id: `${convSeed}-m2`, created_at: new Date(now - Math.floor(rng() * 44) * DAY).toISOString() },
      { onConflict: "demo_seed_id" }
    );
  }

  // 5) Trust event examples + 6) counter refresh. Demo activity never earns trust points.
  log("Creating zero-point demo trust examples + refreshing counters...");
  for (const u of userIds) {
    const { count: practiceCount } = await sb.from("practice_completions").select("id", { count: "exact", head: true }).eq("user_id", u.id);
    const { count: proofCount } = await sb.from("proofs").select("id", { count: "exact", head: true }).eq("user_id", u.id);
    const { count: givenCount } = await sb.from("feedback").select("id", { count: "exact", head: true }).eq("author_id", u.id);
    const recvCount = feedbackReceived.get(u.id) ?? 0;

    const events: any[] = [];
    for (let k = 0; k < (practiceCount ?? 0); k++) events.push({ user_id: u.id, type: "practice", points: 0, label: "Demo practice example", is_demo: true, demo_seed_id: `demo-te-${u.id}-p${k}` });
    for (let k = 0; k < (proofCount ?? 0); k++) events.push({ user_id: u.id, type: "proof", points: 0, label: "Demo proof example", is_demo: true, demo_seed_id: `demo-te-${u.id}-pr${k}` });
    for (let k = 0; k < (givenCount ?? 0); k++) events.push({ user_id: u.id, type: "peer-feedback", points: 0, label: "Demo feedback example", is_demo: true, demo_seed_id: `demo-te-${u.id}-f${k}` });
    if (events.length) await sb.from("trust_events").upsert(events, { onConflict: "demo_seed_id" });

    const { count: usefulGiven } = await sb.from("useful_marks").select("id", { count: "exact", head: true }).eq("user_id", u.id);
    const trustScore = 0;
    await sb.from("profiles").update({
      practice_count: practiceCount ?? 0,
      proof_count: proofCount ?? 0,
      feedback_given_count: givenCount ?? 0,
      feedback_received_count: recvCount,
      contribution_count: usefulGiven ?? 0,
      trust_score: trustScore,
      updated_at: new Date().toISOString()
    }).eq("id", u.id);
  }

  log(`Seed complete: ${userIds.length} members, ${proofs.length} proofs, ${pcMade} practice completions.`);
  log("All rows tagged is_demo=true, demo_cohort='" + DEMO_COHORT + "'.");
}

// ---------------- entry ----------------

async function main() {
  const counts = planCounts();
  log("Collective demo seed");
  log(`  size=${SIZE}  storageMedia=${UPLOAD_STORAGE}  cohort=${DEMO_COHORT}`);
  log(`  planned: ${counts.profiles} members, ${counts.proofs} proofs, ${counts.practiceLogs} practice completions, ${counts.feedback} feedback notes`);

  if (DRY) {
    log("\n--dry-run: no writes performed. (Service key not required for dry-run.)");
    log("Media: brand-safe SVG thumbnails/avatars under /public/demo (generate via: npm run demo:assets).");
    if (UPLOAD_STORAGE) log("Storage upload would target bucket '" + BUCKET + "' under demo/" + DEMO_COHORT + "/.");
    return;
  }

  assertWriteAllowed();
  const sb = admin();

  if (RESET) {
    await reset(sb);
    return;
  }
  if (MEDIA_ONLY) {
    log(UPLOAD_STORAGE
      ? "Media-only: storage upload not implemented in this phase; thumbnails are static under /public/demo."
      : "Media-only: thumbnails are static assets. Run 'npm run demo:assets' to regenerate them.");
    return;
  }

  await seed(sb);
}

main().catch((err) => {
  console.error("\nSeed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
