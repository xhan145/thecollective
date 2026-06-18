/**
 * Generates demo media for the second-tier demo layer as BRAND-SAFE, DARK-MODE-SAFE SVGs:
 *   /public/demo/avatars/{username}.svg   (warm gold/cream disc + initials — no real people)
 *   /public/demo/proof/{kind}-{n}.svg     (gold-family tile + white/ink type glyph)
 *
 * Why SVG (not scraped photos):
 *   - No network, no API keys, fully reproducible, tiny, version-control friendly.
 *   - Brand-safe: no real-person faces (earlier guardrail) and on-brand cream/gold.
 *   - Dark-mode-safe: every asset carries its own warm fill, so it reads as an
 *     intentional card on the warm-dark background (rgb(21,17,10)) — never a white box.
 *   - Served as a static file -> <img src> returns 200 with content-type image/svg+xml.
 *
 * It writes one .svg per username/kind, and ALSO mirrors any existing .jpg basenames in
 * the two folders so every previously-referenced asset gets an .svg twin (the DB just
 * swaps the extension). Idempotent: re-running overwrites with identical bytes.
 *
 * Run: npm run demo:assets   (or tsx scripts/generate-demo-assets.ts)
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

// System font stack so SVG text renders identically without bundling a font.
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// ---------------------------------------------------------------------------
// Avatar SVG — warm disc with a gold ring and initials. Deterministic variant.
// ---------------------------------------------------------------------------

const AVATAR_VARIANTS: [string, string, string][] = [
  // [innerLight, innerDeep, initialsInk]
  ["#FFF6DF", "#FFD986", "#7A5300"],
  ["#FFEFC4", "#FFC04D", "#7A5300"],
  ["#FFF1C7", "#F2A900", "#5E3F00"],
  ["#FFE7AE", "#FFB000", "#6B4900"]
];

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function initialsFor(name: string): string {
  const clean = name.replace(/[^a-zA-Z]/g, "");
  if (!clean) return "M";
  return clean.slice(0, 2).toUpperCase();
}

function avatarSvg(name: string): string {
  const initials = initialsFor(name);
  const [c1, c2, ink] = AVATAR_VARIANTS[hashStr(name) % AVATAR_VARIANTS.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="${initials} avatar">
  <defs>
    <radialGradient id="bg" cx="34%" cy="28%" r="85%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </radialGradient>
  </defs>
  <circle cx="50" cy="50" r="48" fill="url(#bg)" stroke="#F2A900" stroke-width="3"/>
  <text x="50" y="50" font-family="${FONT}" font-size="38" font-weight="800" fill="${ink}" text-anchor="middle" dominant-baseline="central">${initials}</text>
</svg>
`;
}

// ---------------------------------------------------------------------------
// Proof thumbnail SVG — gold-family tile with a white/ink glyph per type.
// Media kinds (image/audio/video) -> deep gold + white glyph.
// Text kinds (text/note/question) -> cream->gold + dark-gold glyph.
// ---------------------------------------------------------------------------

type Palette = { from: string; to: string; ink: string };
const MEDIA_PAL: Palette = { from: "#FFB000", to: "#F2A900", ink: "#FFFFFF" };
const TEXT_PAL: Palette = { from: "#FFF1C7", to: "#FFD986", ink: "#7A5300" };

function paletteFor(kind: ProofKind): Palette {
  return kind === "image" || kind === "audio" || kind === "video" ? MEDIA_PAL : TEXT_PAL;
}

function glyph(kind: ProofKind, ink: string): string {
  const s = `stroke="${ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
  switch (kind) {
    case "text":
      return `<g ${s}>
        <line x1="32" y1="36" x2="68" y2="36"/>
        <line x1="32" y1="50" x2="68" y2="50"/>
        <line x1="32" y1="64" x2="56" y2="64"/>
      </g>`;
    case "note":
      return `<g ${s}>
        <path d="M34 28 h26 l8 8 v36 h-34 z"/>
        <path d="M60 28 v8 h8"/>
        <line x1="40" y1="48" x2="62" y2="48"/>
        <line x1="40" y1="58" x2="56" y2="58"/>
      </g>`;
    case "question":
      return `<text x="50" y="52" font-family="${FONT}" font-size="52" font-weight="800" fill="${ink}" text-anchor="middle" dominant-baseline="central">?</text>`;
    case "image":
      return `<g ${s}>
        <rect x="28" y="32" width="44" height="36" rx="5"/>
        <circle cx="40" cy="44" r="4" fill="${ink}" stroke="none"/>
        <path d="M30 64 l14 -14 l10 10 l8 -8 l10 12"/>
      </g>`;
    case "audio":
      return `<g stroke="${ink}" stroke-width="5" stroke-linecap="round">
        <line x1="34" y1="44" x2="34" y2="56"/>
        <line x1="42" y1="38" x2="42" y2="62"/>
        <line x1="50" y1="30" x2="50" y2="70"/>
        <line x1="58" y1="38" x2="58" y2="62"/>
        <line x1="66" y1="44" x2="66" y2="56"/>
      </g>`;
    case "video":
      return `<g>
        <circle cx="50" cy="50" r="20" fill="none" stroke="${ink}" stroke-width="5"/>
        <path d="M45 41 l14 9 l-14 9 z" fill="${ink}"/>
      </g>`;
  }
}

function proofKindFromName(base: string): ProofKind {
  const k = base.split("-")[0] as ProofKind;
  return (PROOF_KINDS as string[]).includes(k) ? k : "text";
}

function proofSvg(kind: ProofKind, variant: number): string {
  const pal = paletteFor(kind);
  // Subtle per-variant gradient angle so the pool doesn't look identical.
  const angles = [
    { x1: "0", y1: "0", x2: "100", y2: "100" },
    { x1: "0", y1: "100", x2: "100", y2: "0" },
    { x1: "0", y1: "0", x2: "100", y2: "0" },
    { x1: "0", y1: "0", x2: "0", y2: "100" }
  ];
  const a = angles[variant % angles.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="${kind} proof thumbnail">
  <defs>
    <linearGradient id="bg" x1="${a.x1}" y1="${a.y1}" x2="${a.x2}" y2="${a.y2}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${pal.from}"/>
      <stop offset="100%" stop-color="${pal.to}"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="100" height="100" fill="url(#bg)"/>
  ${glyph(kind, pal.ink)}
</svg>
`;
}

// ---------------------------------------------------------------------------
// Write everything (idempotent).
// ---------------------------------------------------------------------------

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function existingBasenames(dir: string, ext: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(ext))
    .map((f) => parse(f).name);
}

function main() {
  ensureDir(AVATAR_DIR);
  ensureDir(PROOF_DIR);

  // --- Avatars: canonical persona usernames (covers the live 90) + any existing basenames.
  const avatarNames = new Set<string>();
  buildPersonas(SIZES.large.profiles).forEach((p) => avatarNames.add(p.username));
  existingBasenames(AVATAR_DIR, ".jpg").forEach((b) => avatarNames.add(b));
  existingBasenames(AVATAR_DIR, ".svg").forEach((b) => avatarNames.add(b));
  // Local-demo (betaData) ids, just in case any are not in the persona set.
  ["alex", "jordan", "taylor", "morgan", "casey", "riley", "sam", "jamie", "drew", "quinn",
   "avery", "parker", "reese", "skyler", "devon", "harper", "rowan", "emerson", "finley", "sage",
   "kai", "noor", "luca", "mateo", "priya", "aisha", "diego", "lena", "omar", "gregory"]
    .forEach((n) => avatarNames.add(n));

  let avatarCount = 0;
  for (const name of avatarNames) {
    writeFileSync(join(AVATAR_DIR, `${name}.svg`), avatarSvg(name), "utf8");
    avatarCount++;
  }

  // --- Proofs: canonical kind x pool + any existing basenames.
  const proofBases = new Set<string>();
  for (const kind of PROOF_KINDS) {
    for (let n = 0; n < ASSET_POOL_PER_KIND; n++) proofBases.add(`${kind}-${n}`);
  }
  existingBasenames(PROOF_DIR, ".jpg").forEach((b) => proofBases.add(b));
  existingBasenames(PROOF_DIR, ".svg").forEach((b) => proofBases.add(b));

  let proofCount = 0;
  for (const base of proofBases) {
    const kind = proofKindFromName(base);
    const variant = parseInt(base.split("-")[1] ?? "0", 10) || 0;
    writeFileSync(join(PROOF_DIR, `${base}.svg`), proofSvg(kind, variant), "utf8");
    proofCount++;
  }

  console.log(`wrote ${avatarCount} avatar SVGs -> ${AVATAR_DIR}`);
  console.log(`wrote ${proofCount} proof SVGs   -> ${PROOF_DIR}`);
  console.log(`proof kinds: ${PROOF_KINDS.join(", ")} (pool ${ASSET_POOL_PER_KIND} each)`);
}

main();
