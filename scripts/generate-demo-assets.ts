/**
 * Generates demo media for the second-tier demo layer:
 *   /public/demo/avatars/{username}.jpg   (real royalty-free face photos, one per persona)
 *   /public/demo/proof/{kind}-{n}.jpg     (real themed photos, a reusable pool per proof kind)
 *
 * How it works:
 *   - Branded JPG baselines are committed to the repo, so the demo always has
 *     valid thumbnails even with no network and even if you never run this.
 *   - When you run it on a machine with internet, it downloads real photos
 *     (faces for avatars, themed stock for proofs) and overwrites the baselines.
 *   - Every download is validated; if a fetch fails or returns junk, the
 *     committed baseline is kept. The script never leaves a broken image.
 *
 * Sources (no API key required):
 *   - Avatars: randomuser.me portrait set (royalty-free).
 *   - Proofs:  loremflickr.com (keyword-themed) -> picsum.photos (seeded) fallback.
 *
 * Run: npm run demo:assets   (or tsx scripts/generate-demo-assets.ts)
 * Flags: --force-baseline  -> skip all downloads, keep committed baselines.
 */
import { existsSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ASSET_POOL_PER_KIND,
  buildPersonas,
  mulberry32,
  PROOF_KINDS,
  SIZES,
  type ProofKind
} from "./demo/shared";

const ROOT = process.cwd();
const AVATAR_DIR = join(ROOT, "public", "demo", "avatars");
const PROOF_DIR = join(ROOT, "public", "demo", "proof");

const FORCE_BASELINE = process.argv.includes("--force-baseline");
const TIMEOUT_MS = 15_000;
const CONCURRENCY = 6;
const MIN_BYTES = 2_048; // anything smaller is almost certainly an error page

// Themed search keywords per proof kind (loremflickr tags).
const PROOF_KEYWORDS: Record<ProofKind, string> = {
  text: "journal,notebook,writing,desk",
  image: "lifestyle,minimal,nature,workspace",
  audio: "microphone,podcast,studio,headphones",
  video: "speaking,presentation,stage,camera",
  question: "books,library,study,thinking",
  note: "notebook,handwriting,planner,journal"
};

type Job = { url: string; fallbackUrl?: string; dest: string; label: string };

function looksLikeImage(buf: Buffer): boolean {
  if (buf.length < MIN_BYTES) return false;
  const jpg = buf[0] === 0xff && buf[1] === 0xd8;
  const png = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const webp = buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP";
  return jpg || png || webp;
}

async function fetchImage(url: string): Promise<Buffer | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { redirect: "follow", signal: ctrl.signal });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return looksLikeImage(buf) ? buf : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Download a job; write only on success. Returns "downloaded" | "kept" | "missing". */
async function runJob(job: Job): Promise<"downloaded" | "kept" | "missing"> {
  const buf = (await fetchImage(job.url)) ?? (job.fallbackUrl ? await fetchImage(job.fallbackUrl) : null);
  if (buf) {
    writeFileSync(job.dest, buf);
    return "downloaded";
  }
  if (existsSync(job.dest) && statSync(job.dest).size >= MIN_BYTES) return "kept";
  return "missing";
}

async function runPool(jobs: Job[]) {
  let downloaded = 0, kept = 0, missing = 0, i = 0;
  async function worker() {
    while (i < jobs.length) {
      const job = jobs[i++];
      const r = await runJob(job);
      if (r === "downloaded") downloaded++;
      else if (r === "kept") kept++;
      else { missing++; console.warn(`  ! no image and no baseline for ${job.label} (${job.dest})`); }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker));
  return { downloaded, kept, missing };
}

/** Deterministic pool of real-face portrait URLs (randomuser.me). */
function avatarUrlPool(): string[] {
  const pool: string[] = [];
  for (const gender of ["men", "women"]) {
    for (let n = 0; n < 100; n++) pool.push(`https://randomuser.me/api/portraits/${gender}/${n}.jpg`);
  }
  const rng = mulberry32(987654);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

function buildAvatarJobs(): Job[] {
  const personas = buildPersonas(SIZES.large.profiles); // 90 covers every size
  const pool = avatarUrlPool();
  return personas.map((p) => ({
    url: pool[p.index % pool.length],
    dest: join(AVATAR_DIR, `${p.username}.jpg`),
    label: `avatar ${p.username}`
  }));
}

function buildProofJobs(): Job[] {
  const jobs: Job[] = [];
  PROOF_KINDS.forEach((kind, ki) => {
    const kw = encodeURIComponent(PROOF_KEYWORDS[kind]);
    for (let n = 0; n < ASSET_POOL_PER_KIND; n++) {
      const lock = ki * 100 + n;
      jobs.push({
        url: `https://loremflickr.com/640/400/${kw}?lock=${lock}`,
        fallbackUrl: `https://picsum.photos/seed/${kind}-${n}/640/400`,
        dest: join(PROOF_DIR, `${kind}-${n}.jpg`),
        label: `proof ${kind}-${n}`
      });
    }
  });
  return jobs;
}

async function main() {
  const avatarJobs = buildAvatarJobs();
  const proofJobs = buildProofJobs();

  if (FORCE_BASELINE) {
    console.log("--force-baseline: skipping downloads, keeping committed JPG baselines.");
    const a = avatarJobs.filter((j) => existsSync(j.dest)).length;
    const p = proofJobs.filter((j) => existsSync(j.dest)).length;
    console.log(`Baselines present: ${a}/${avatarJobs.length} avatars, ${p}/${proofJobs.length} proofs.`);
    return;
  }

  console.log(`Fetching real photos (timeout ${TIMEOUT_MS / 1000}s, concurrency ${CONCURRENCY})...`);
  console.log(`Avatars: ${avatarJobs.length} faces  ·  Proofs: ${proofJobs.length} themed photos`);

  const av = await runPool(avatarJobs);
  console.log(`Avatars  -> downloaded ${av.downloaded}, kept baseline ${av.kept}, missing ${av.missing}`);
  const pr = await runPool(proofJobs);
  console.log(`Proofs   -> downloaded ${pr.downloaded}, kept baseline ${pr.kept}, missing ${pr.missing}`);

  if (av.missing + pr.missing > 0) {
    console.log("\nSome assets had no network image and no baseline. Re-run with internet, or commit baselines first.");
  } else if (av.downloaded + pr.downloaded === 0) {
    console.log("\nNo downloads succeeded (offline?). Committed baselines are in place, so the demo still has valid thumbnails.");
  } else {
    console.log("\nDone. Real photos written to public/demo/. Commit them so they deploy with the app.");
  }
}

main().catch((e) => {
  console.error("Asset generation error:", e);
  process.exit(1);
});
