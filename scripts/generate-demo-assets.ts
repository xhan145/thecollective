/**
 * Generates demo media for the second-tier demo layer as ILLUSTRATED, BRAND-SAFE,
 * DARK-MODE-SAFE SVGs (no real people, no network, fully reproducible):
 *   /public/demo/avatars/{username}.svg   (illustrated portrait: varied skin/hair/expression)
 *   /public/demo/proof/{kind}-{n}.svg     (illustrated scene per proof type)
 *
 * Why SVG (not scraped/AI raster photos):
 *   - No API key, no cost, deterministic (same bytes every run), tiny, VC-friendly.
 *   - Brand-safe: synthetic illustrated faces — no real-person likeness or copyright.
 *   - Dark-mode-safe: every asset carries its own warm fill, so it reads as an
 *     intentional element on the warm-dark background rgb(21,17,10) — never a white box.
 *   - Served static -> <img src> returns 200 with content-type image/svg+xml.
 *
 * NOTE: this is illustrated, not photoreal. True photoreal faces/photos require an
 * image model (OpenAI gpt-image-1, Replicate, etc.) + an API key — out of scope here.
 *
 * Run: npm run demo:assets
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join, parse } from "node:path";
import {
  ASSET_POOL_PER_KIND,
  buildPersonas,
  PROOF_KINDS,
  SIZES,
  type ProofKind
} from "./demo/shared";

const ROOT = process.cwd();
const AVATAR_DIR = join(ROOT, "public", "demo", "avatars");
const PROOF_DIR = join(ROOT, "public", "demo", "proof");

// ---------------------------------------------------------------------------
// Deterministic per-name selection.
// ---------------------------------------------------------------------------
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const pick = <T,>(name: string, salt: string, arr: T[]): T => arr[hash(name + salt) % arr.length];
const chance = (name: string, salt: string, oneIn: number): boolean => hash(name + salt) % oneIn === 0;

// ---------------------------------------------------------------------------
// Illustrated portrait avatar.
// ---------------------------------------------------------------------------
const BG = ["#FFE9B8", "#FFF1C7", "#FCE3C2", "#F6E7CE", "#FFE2C0", "#F3E2C8"];
const SKIN = ["#F8D9C0", "#F1C9A5", "#E0AC81", "#C68A5E", "#A56A41", "#7A4A2B"];
const SKIN_SHADOW = ["#E8C2A6", "#E0B58C", "#CC9469", "#B0744A", "#8E5733", "#643B22"];
const HAIR = ["#2B1B14", "#4A2E1C", "#6B4423", "#8C5A2B", "#B07A3A", "#C9A24B", "#9A9A9A", "#1A1A1A", "#5A3A2A"];
const SHIRT = ["#F2A900", "#6E8E5A", "#5A7D9A", "#B5654D", "#7A5C8E", "#C98A3A", "#4A6670", "#A24D5A"];

function hairPath(style: number, c: string): string {
  switch (style) {
    case 0: // short rounded
      return `<path d="M28 47 C26 25 74 25 72 47 C72 37 70 30 50 30 C30 30 28 37 28 47 Z" fill="${c}"/>`;
    case 1: // side part
      return `<path d="M28 47 C27 26 73 26 72 46 C72 34 64 31 46 32 C40 32 30 34 28 47 Z" fill="${c}"/>`;
    case 2: // long (cap + sides)
      return `<path d="M27 46 C25 24 75 24 73 46 C73 36 70 30 50 30 C30 30 27 36 27 46 Z" fill="${c}"/>
        <path d="M26 44 Q22 64 30 74 L35 71 Q30 56 32 46 Z" fill="${c}"/>
        <path d="M74 44 Q78 64 70 74 L65 71 Q70 56 68 46 Z" fill="${c}"/>`;
    case 3: // bun
      return `<circle cx="50" cy="19" r="8" fill="${c}"/>
        <path d="M28 46 C27 27 73 27 72 46 C72 35 68 31 50 31 C32 31 28 35 28 46 Z" fill="${c}"/>`;
    case 4: // curly cloud
      return ["M34 34", "44 27", "56 27", "66 34", "37 41", "63 41", "50 25"]
        .map((p) => { const [x, y] = p.replace("M", "").trim().split(" "); return `<circle cx="${x}" cy="${y}" r="9" fill="${c}"/>`; })
        .join("");
    case 5: // buzz / short fade
      return `<path d="M30 45 C29 32 71 32 70 45 C68 38 64 35 50 35 C36 35 32 38 30 45 Z" fill="${c}"/>`;
    default: // tied-back / receding
      return `<path d="M30 44 C31 30 69 30 70 44 C68 36 62 33 50 33 C38 33 32 36 30 44 Z" fill="${c}"/>`;
  }
}

function avatarSvg(name: string): string {
  const bg = pick(name, "bg", BG);
  const si = hash(name + "skin") % SKIN.length;
  const skin = SKIN[si];
  const skinShadow = SKIN_SHADOW[si];
  const hair = pick(name, "hair", HAIR);
  const shirt = pick(name, "shirt", SHIRT);
  const style = hash(name + "style") % 7;
  const glasses = chance(name, "glasses", 4);
  const beard = chance(name, "beard", 5) && style !== 3;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="member portrait">
  <defs>
    <radialGradient id="bg" cx="42%" cy="34%" r="75%">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${bg}" stop-opacity="0.78"/>
    </radialGradient>
    <clipPath id="disc"><circle cx="50" cy="50" r="50"/></clipPath>
  </defs>
  <g clip-path="url(#disc)">
    <rect x="0" y="0" width="100" height="100" fill="url(#bg)"/>
    <circle cx="50" cy="50" r="50" fill="none" stroke="#F2A900" stroke-width="2.5" stroke-opacity="0.55"/>
    <!-- shoulders -->
    <path d="M16 100 Q16 76 50 76 Q84 76 84 100 Z" fill="${shirt}"/>
    <path d="M42 78 Q50 86 58 78 L58 72 Q50 76 42 72 Z" fill="${shirt}" opacity="0.85"/>
    <!-- neck -->
    <rect x="44" y="64" width="12" height="14" rx="5" fill="${skinShadow}"/>
    <!-- head -->
    <ellipse cx="50" cy="47" rx="21" ry="23" fill="${skin}"/>
    <circle cx="28" cy="49" r="4" fill="${skin}"/>
    <circle cx="72" cy="49" r="4" fill="${skin}"/>
    <!-- cheeks -->
    <ellipse cx="40" cy="54" rx="3.5" ry="2.4" fill="#E8896B" opacity="0.28"/>
    <ellipse cx="60" cy="54" rx="3.5" ry="2.4" fill="#E8896B" opacity="0.28"/>
    ${beard ? `<path d="M31 50 Q33 70 50 72 Q67 70 69 50 Q64 63 50 63 Q36 63 31 50 Z" fill="${hair}" opacity="0.92"/>` : ""}
    <!-- eyes -->
    <ellipse cx="42.5" cy="46" rx="2.3" ry="3" fill="#2A2018"/>
    <ellipse cx="57.5" cy="46" rx="2.3" ry="3" fill="#2A2018"/>
    <circle cx="43.3" cy="45" r="0.8" fill="#fff" opacity="0.85"/>
    <circle cx="58.3" cy="45" r="0.8" fill="#fff" opacity="0.85"/>
    <!-- brows -->
    <path d="M39 41 Q42.5 39 46 41" stroke="${hair}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M54 41 Q57.5 39 61 41" stroke="${hair}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <!-- nose -->
    <path d="M50 47 L48 53 Q50 55 52 53" stroke="${skinShadow}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- mouth -->
    <path d="M44 58 Q50 63 56 58" stroke="#9A4A38" stroke-width="2" fill="none" stroke-linecap="round"/>
    ${glasses ? `<g stroke="#33302B" stroke-width="1.6" fill="none">
      <circle cx="42.5" cy="46" r="5.2"/><circle cx="57.5" cy="46" r="5.2"/>
      <line x1="47.7" y1="46" x2="52.3" y2="46"/><line x1="37.3" y1="46" x2="31" y2="44"/><line x1="62.7" y1="46" x2="69" y2="44"/>
    </g>` : ""}
    <!-- hair on top -->
    ${hairPath(style, hair)}
  </g>
</svg>
`;
}

// ---------------------------------------------------------------------------
// Illustrated proof scenes per kind.
// ---------------------------------------------------------------------------
function bgGold(): string {
  return `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFC23D"/><stop offset="100%" stop-color="#F2A900"/>
    </linearGradient>
    <radialGradient id="gloss" cx="30%" cy="22%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.30"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" fill="url(#bg)"/><rect width="100" height="100" fill="url(#gloss)"/>`;
}
function bgCream(): string {
  return `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFF3D0"/><stop offset="100%" stop-color="#FFDD93"/>
    </linearGradient>
    <radialGradient id="gloss" cx="28%" cy="20%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100" height="100" fill="url(#bg)"/><rect width="100" height="100" fill="url(#gloss)"/>`;
}
const SHADOW = `fill="#000000" opacity="0.10"`;

function proofScene(kind: ProofKind, variant: number): string {
  const ink = "#5E3F00";
  switch (kind) {
    case "text":
      return `${bgCream()}
        <rect x="32" y="26" width="40" height="50" rx="3" ${SHADOW}/>
        <rect x="29" y="24" width="40" height="50" rx="3" fill="#FFFDF8"/>
        <g stroke="${ink}" stroke-width="2.4" stroke-linecap="round" opacity="0.85">
          <line x1="35" y1="34" x2="63" y2="34"/><line x1="35" y1="42" x2="63" y2="42"/>
          <line x1="35" y1="50" x2="63" y2="50"/><line x1="35" y1="58" x2="54" y2="58"/></g>
        <rect x="56" y="60" width="18" height="5" rx="2.5" transform="rotate(-38 56 60)" fill="#F2A900" stroke="${ink}" stroke-width="1.2"/>
        <path d="M56 60 l-3 5 5 -1 z" transform="rotate(-38 56 60)" fill="${ink}"/>`;
    case "note":
      return `${bgCream()}
        <rect x="31" y="26" width="42" height="48" rx="3" ${SHADOW}/>
        <rect x="28" y="24" width="42" height="48" rx="3" fill="#FFF6D8"/>
        <g stroke="#E0A800" stroke-width="2"><line x1="34" y1="24" x2="34" y2="72"/></g>
        <g fill="#E0A800"><circle cx="34" cy="30" r="1.6"/><circle cx="34" cy="40" r="1.6"/><circle cx="34" cy="50" r="1.6"/><circle cx="34" cy="60" r="1.6"/></g>
        <g stroke="${ink}" stroke-width="2.2" stroke-linecap="round" opacity="0.8">
          <line x1="40" y1="34" x2="64" y2="34"/><line x1="40" y1="44" x2="64" y2="44"/>
          <line x1="40" y1="54" x2="58" y2="54"/></g>
        <path d="M58 72 l12 0 0 -12 z" fill="#FFE7A8" stroke="${ink}" stroke-width="0.8"/>`;
    case "question":
      return `${bgCream()}
        <path d="M24 30 h44 a6 6 0 0 1 6 6 v22 a6 6 0 0 1 -6 6 h-22 l-12 10 v-10 h-4 a6 6 0 0 1 -6 -6 v-22 a6 6 0 0 1 6 -6 z" ${SHADOW} transform="translate(2 2)"/>
        <path d="M24 30 h44 a6 6 0 0 1 6 6 v22 a6 6 0 0 1 -6 6 h-22 l-12 10 v-10 h-4 a6 6 0 0 1 -6 -6 v-22 a6 6 0 0 1 6 -6 z" fill="#FFFDF8"/>
        <text x="49" y="50" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="800" fill="#F2A900" text-anchor="middle" dominant-baseline="central">?</text>`;
    case "image":
      return `${bgGold()}
        <rect x="22" y="28" width="58" height="46" rx="4" ${SHADOW}/>
        <rect x="20" y="26" width="58" height="46" rx="4" fill="#FFFDF8"/>
        <clipPath id="ph"><rect x="24" y="30" width="50" height="38" rx="2"/></clipPath>
        <g clip-path="url(#ph)">
          <rect x="24" y="30" width="50" height="38" fill="#BFE3F2"/>
          <circle cx="62" cy="40" r="6" fill="#FFD15C"/>
          <path d="M24 68 L40 50 L50 60 L60 48 L74 64 L74 68 Z" fill="#7FB069"/>
          <path d="M24 68 L44 56 L58 66 L74 56 L74 68 Z" fill="#5C8A4A"/>
        </g>`;
    case "audio":
      return `${bgGold()}
        <g stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.9" fill="none">
          <path d="M22 50 q4 -10 8 0 q4 -16 8 0 q4 -22 8 0"/>
          <path d="M70 50 q4 -16 8 0"/></g>
        <rect x="44" y="22" width="12" height="26" rx="6" ${SHADOW} transform="translate(2 2)"/>
        <rect x="44" y="22" width="12" height="26" rx="6" fill="#FFFDF8"/>
        <path d="M40 44 a10 10 0 0 0 20 0" stroke="#FFFDF8" stroke-width="3" fill="none"/>
        <line x1="50" y1="54" x2="50" y2="64" stroke="#FFFDF8" stroke-width="3"/>
        <line x1="42" y1="66" x2="58" y2="66" stroke="#FFFDF8" stroke-width="3" stroke-linecap="round"/>`;
    case "video":
      return `${bgGold()}
        <rect x="22" y="30" width="56" height="40" rx="5" ${SHADOW} transform="translate(2 2)"/>
        <rect x="22" y="30" width="56" height="40" rx="5" fill="#3A2A12"/>
        <rect x="22" y="30" width="56" height="6" fill="#211705"/><rect x="22" y="64" width="56" height="6" fill="#211705"/>
        <g fill="#F2A900"><rect x="25" y="31.5" width="3" height="3"/><rect x="33" y="31.5" width="3" height="3"/><rect x="41" y="31.5" width="3" height="3"/><rect x="49" y="31.5" width="3" height="3"/><rect x="57" y="31.5" width="3" height="3"/><rect x="65" y="31.5" width="3" height="3"/><rect x="72" y="31.5" width="3" height="3"/>
          <rect x="25" y="65.5" width="3" height="3"/><rect x="33" y="65.5" width="3" height="3"/><rect x="41" y="65.5" width="3" height="3"/><rect x="49" y="65.5" width="3" height="3"/><rect x="57" y="65.5" width="3" height="3"/><rect x="65" y="65.5" width="3" height="3"/><rect x="72" y="65.5" width="3" height="3"/></g>
        <circle cx="50" cy="50" r="11" fill="#FFFDF8" opacity="0.95"/>
        <path d="M47 44 l9 6 l-9 6 z" fill="#F2A900"/>`;
  }
}

// ---------------------------------------------------------------------------
// Write everything (idempotent).
// ---------------------------------------------------------------------------
function ensureDir(dir: string) { if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); }
function existingBasenames(dir: string, ext: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.toLowerCase().endsWith(ext)).map((f) => parse(f).name);
}
function proofKindFromName(base: string): ProofKind {
  const k = base.split("-")[0] as ProofKind;
  return (PROOF_KINDS as string[]).includes(k) ? k : "text";
}
function wrapProof(kind: ProofKind, variant: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="${kind} proof">${proofScene(kind, variant)}</svg>\n`;
}

function main() {
  ensureDir(AVATAR_DIR);
  ensureDir(PROOF_DIR);

  const avatarNames = new Set<string>();
  buildPersonas(SIZES.large.profiles).forEach((p) => avatarNames.add(p.username));
  existingBasenames(AVATAR_DIR, ".svg").forEach((b) => avatarNames.add(b));
  ["alex", "jordan", "taylor", "morgan", "casey", "riley", "sam", "jamie", "drew", "quinn",
   "avery", "parker", "reese", "skyler", "devon", "harper", "rowan", "emerson", "finley", "sage",
   "kai", "noor", "luca", "mateo", "priya", "aisha", "diego", "lena", "omar", "gregory"]
    .forEach((n) => avatarNames.add(n));

  let avatarCount = 0;
  for (const name of avatarNames) { writeFileSync(join(AVATAR_DIR, `${name}.svg`), avatarSvg(name), "utf8"); avatarCount++; }

  const proofBases = new Set<string>();
  for (const kind of PROOF_KINDS) for (let n = 0; n < ASSET_POOL_PER_KIND; n++) proofBases.add(`${kind}-${n}`);
  existingBasenames(PROOF_DIR, ".svg").forEach((b) => proofBases.add(b));

  let proofCount = 0;
  for (const base of proofBases) {
    const kind = proofKindFromName(base);
    const variant = parseInt(base.split("-")[1] ?? "0", 10) || 0;
    writeFileSync(join(PROOF_DIR, `${base}.svg`), wrapProof(kind, variant), "utf8");
    proofCount++;
  }

  console.log(`wrote ${avatarCount} illustrated avatar SVGs -> ${AVATAR_DIR}`);
  console.log(`wrote ${proofCount} illustrated proof SVGs   -> ${PROOF_DIR}`);
}

main();
