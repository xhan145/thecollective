/**
 * Imports a photoreal-style asset pack (synthetic, fictional faces + themed scene
 * thumbnails) into /public/demo, replacing the illustrated SVG placeholders.
 *
 *   pack/avatars/collective_avatar_NNN.jpg     -> public/demo/avatars/{username}.jpg
 *   pack/thumbnails/collective_thumbnail_NNN.jpg -> public/demo/proof/{kind}-{n}.jpg
 *
 * Thumbnails are TYPE-MATCHED to proof kinds using the pack manifest `theme`
 * column (voice note -> audio, recording -> video, journal/quiet -> text,
 * momentum/useful-feedback -> note, questions/feedback -> question, scenes -> image).
 * Avatars are assigned deterministically (sorted username -> sorted pool) so the
 * mapping is stable across runs.
 *
 * The pack itself is NOT committed; only the selected/renamed subset the app uses
 * is written into public/demo and committed. SVG twins are removed.
 *
 * Usage: tsx scripts/import-photoreal-pack.ts <PACK_DIR>
 *   PACK_DIR must contain avatars/, thumbnails/, manifest_assets.csv
 *   (env PACK_DIR also works). These are synthetic prototype placeholders — per the
 *   pack README, replace with consented/licensed media before public launch.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join, parse } from "node:path";
import { ASSET_POOL_PER_KIND, buildPersonas, PROOF_KINDS, SIZES, type ProofKind } from "./demo/shared";

const ROOT = process.cwd();
const AVATAR_OUT = join(ROOT, "public", "demo", "avatars");
const PROOF_OUT = join(ROOT, "public", "demo", "proof");

const PACK = process.argv[2] || process.env.PACK_DIR || "";
if (!PACK || !existsSync(PACK)) {
  console.error("PACK_DIR not found. Pass the extracted pack dir as the first arg (must contain avatars/, thumbnails/, manifest_assets.csv).");
  process.exit(1);
}
const PACK_AVA = join(PACK, "avatars");
const PACK_THUMB = join(PACK, "thumbnails");
const MANIFEST = join(PACK, "manifest_assets.csv");

// theme keyword -> proof kind (first match wins; disjoint pools per kind)
function kindForTheme(theme: string): ProofKind {
  const t = theme.toLowerCase();
  if (t.includes("voice note")) return "audio";
  if (t.includes("recording")) return "video";
  if (t.includes("journal") || t.includes("quiet focus") || t.includes("walk")) return "text";
  if (t.includes("momentum") || t.includes("useful feedback")) return "note";
  if (t.includes("question") || t.includes("feedback conversation")) return "question";
  return "image"; // confidence/communication/contribution/mentor/progress/etc. scenes
}

function ensureDir(d: string) { if (!existsSync(d)) mkdirSync(d, { recursive: true }); }

function main() {
  ensureDir(AVATAR_OUT);
  ensureDir(PROOF_OUT);

  // ---- Parse manifest, bucket thumbnails by proof kind ----
  const rows = readFileSync(MANIFEST, "utf8").trim().split(/\r?\n/).slice(1);
  const buckets: Record<ProofKind, string[]> = { text: [], image: [], audio: [], video: [], question: [], note: [] };
  for (const line of rows) {
    const cols = line.split(",");
    const category = cols[2];
    const theme = cols[4] ?? "";
    if (category !== "thumbnail") continue;
    const file = parse(cols[1]).base; // collective_thumbnail_NNN.jpg
    if (existsSync(join(PACK_THUMB, file))) buckets[kindForTheme(theme)].push(file);
  }
  for (const k of PROOF_KINDS) buckets[k].sort();

  // ---- Avatar basenames the app references (mirror the SVG generator's set) ----
  const names = new Set<string>();
  buildPersonas(SIZES.large.profiles).forEach((p) => names.add(p.username));
  ["alex","jordan","taylor","morgan","casey","riley","sam","jamie","drew","quinn",
   "avery","parker","reese","skyler","devon","harper","rowan","emerson","finley","sage",
   "kai","noor","luca","mateo","priya","aisha","diego","lena","omar","gregory"].forEach((n) => names.add(n));
  if (existsSync(AVATAR_OUT)) readdirSync(AVATAR_OUT).forEach((f) => names.add(parse(f).name));

  const avatarPool = readdirSync(PACK_AVA).filter((f) => /\.jpe?g$/i.test(f)).sort();
  const orderedNames = [...names].sort();
  if (orderedNames.length > avatarPool.length) {
    console.warn(`! ${orderedNames.length} usernames but only ${avatarPool.length} pool avatars — some will repeat.`);
  }

  // ---- Write avatars (sorted username -> sorted pool, stable) ----
  let av = 0;
  orderedNames.forEach((name, i) => {
    copyFileSync(join(PACK_AVA, avatarPool[i % avatarPool.length]), join(AVATAR_OUT, `${name}.jpg`));
    av++;
  });

  // ---- Write thumbnails per kind/variant ----
  let th = 0;
  for (const kind of PROOF_KINDS) {
    const pool = buckets[kind];
    if (!pool.length) { console.warn(`! no thumbnails matched kind "${kind}"`); continue; }
    for (let n = 0; n < ASSET_POOL_PER_KIND; n++) {
      copyFileSync(join(PACK_THUMB, pool[n % pool.length]), join(PROOF_OUT, `${kind}-${n}.jpg`));
      th++;
    }
  }

  // ---- Remove SVG twins (DB + seed now point at .jpg) ----
  let removed = 0;
  for (const dir of [AVATAR_OUT, PROOF_OUT]) {
    for (const f of readdirSync(dir)) if (f.toLowerCase().endsWith(".svg")) { rmSync(join(dir, f)); removed++; }
  }

  console.log(`avatars written: ${av}  (pool ${avatarPool.length})`);
  console.log(`thumbnails written: ${th}  buckets: ${PROOF_KINDS.map((k) => `${k}=${buckets[k].length}`).join(", ")}`);
  console.log(`removed ${removed} SVG placeholders`);
}

main();
