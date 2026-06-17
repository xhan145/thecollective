/**
 * Generates lightweight, brand-safe demo SVG assets:
 *   /public/demo/avatars/{username}.svg   (one per persona, initials)
 *   /public/demo/proof/{kind}-{n}.svg     (a small reusable pool per proof kind)
 *
 * No photos, no proprietary fonts, no real people. Collective colours only.
 * Run: npm run demo:assets   (or tsx scripts/generate-demo-assets.ts)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ASSET_POOL_PER_KIND, buildPersonas, COLORS, mulberry32, PROOF_KINDS, SIZES, type ProofKind } from "./demo/shared";

const ROOT = process.cwd();
const AVATAR_DIR = join(ROOT, "public", "demo", "avatars");
const PROOF_DIR = join(ROOT, "public", "demo", "proof");

const GOLD_ACCENTS = ["#F2A900", "#FFB000", "#E59400", "#FFC23D"];

function avatarSvg(initials: string, accent: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" role="img" aria-label="Sample member avatar">
  <rect width="200" height="200" rx="40" fill="${COLORS.card}"/>
  <circle cx="100" cy="100" r="74" fill="${COLORS.soft}"/>
  <circle cx="100" cy="100" r="74" fill="none" stroke="${accent}" stroke-width="6"/>
  <text x="100" y="100" dy="0.35em" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="64" font-weight="800" fill="${COLORS.ink}">${initials}</text>
</svg>`;
}

function card(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200" role="img" aria-label="Sample proof">
  <rect width="320" height="200" rx="22" fill="${COLORS.card}"/>
  <rect x="1" y="1" width="318" height="198" rx="21" fill="none" stroke="${COLORS.line}" stroke-width="2"/>
  ${inner}
</svg>`;
}

function proofSvg(kind: ProofKind, n: number): string {
  const rng = mulberry32(kind.length * 1000 + n);
  switch (kind) {
    case "audio": {
      const bars = Array.from({ length: 28 }, (_, i) => {
        const h = 14 + Math.floor(rng() * 90);
        return `<rect x="${20 + i * 10}" y="${100 - h / 2}" width="5" height="${h}" rx="2.5" fill="${COLORS.gold}"/>`;
      }).join("");
      return card(`<rect width="320" height="200" rx="22" fill="${COLORS.soft}"/>${bars}<text x="20" y="180" font-family="system-ui" font-size="14" font-weight="700" fill="${COLORS.muted}">Voice note</text>`);
    }
    case "video":
      return card(`<rect width="320" height="200" rx="22" fill="${COLORS.soft}"/><circle cx="160" cy="92" r="40" fill="${COLORS.card}"/><path d="M150 72 L150 112 L184 92 Z" fill="${COLORS.gold}"/><text x="20" y="180" font-family="system-ui" font-size="14" font-weight="700" fill="${COLORS.muted}">Short clip</text>`);
    case "image":
      return card(`<defs><linearGradient id="g${n}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${COLORS.soft}"/><stop offset="1" stop-color="${COLORS.goldBright}"/></linearGradient></defs><rect width="320" height="200" rx="22" fill="url(#g${n})"/><circle cx="${90 + Math.floor(rng() * 140)}" cy="80" r="34" fill="${COLORS.card}" opacity="0.85"/><rect x="40" y="140" width="${120 + Math.floor(rng() * 120)}" height="14" rx="7" fill="${COLORS.card}" opacity="0.8"/>`);
    case "question":
      return card(`<text x="40" y="86" font-family="system-ui" font-size="40" font-weight="800" fill="${COLORS.line}">?</text><path d="M70 96 L120 96" stroke="${COLORS.gold}" stroke-width="6" stroke-linecap="round"/><path d="M112 86 L124 96 L112 106" fill="none" stroke="${COLORS.gold}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><text x="140" y="100" dy="0.35em" font-family="system-ui" font-size="34" font-weight="800" fill="${COLORS.gold}">!</text><text x="40" y="170" font-family="system-ui" font-size="14" font-weight="700" fill="${COLORS.muted}">Better question</text>`);
    case "note":
      return card(`<rect x="28" y="34" width="${180 + Math.floor(rng() * 80)}" height="13" rx="6.5" fill="${COLORS.soft}"/><rect x="28" y="64" width="${120 + Math.floor(rng() * 140)}" height="13" rx="6.5" fill="${COLORS.soft}"/><rect x="28" y="94" width="${150 + Math.floor(rng() * 110)}" height="13" rx="6.5" fill="${COLORS.soft}"/><rect x="28" y="124" width="${90 + Math.floor(rng() * 120)}" height="13" rx="6.5" fill="${COLORS.soft}"/><circle cx="288" cy="40" r="10" fill="${COLORS.gold}"/>`);
    default: // text
      return card(`<rect x="28" y="40" width="240" height="16" rx="8" fill="${COLORS.ink}" opacity="0.82"/><rect x="28" y="74" width="${160 + Math.floor(rng() * 100)}" height="13" rx="6.5" fill="${COLORS.soft}"/><rect x="28" y="102" width="${180 + Math.floor(rng() * 80)}" height="13" rx="6.5" fill="${COLORS.soft}"/><rect x="28" y="130" width="${120 + Math.floor(rng() * 120)}" height="13" rx="6.5" fill="${COLORS.soft}"/>`);
  }
}

function main() {
  mkdirSync(AVATAR_DIR, { recursive: true });
  mkdirSync(PROOF_DIR, { recursive: true });

  // Avatars for the largest persona set so every size is covered.
  const personas = buildPersonas(SIZES.large.profiles);
  for (const p of personas) {
    const accent = GOLD_ACCENTS[p.index % GOLD_ACCENTS.length];
    writeFileSync(join(AVATAR_DIR, `${p.username}.svg`), avatarSvg(p.initials, accent));
  }

  // Proof thumbnail pool per kind.
  let proofCount = 0;
  for (const kind of PROOF_KINDS) {
    for (let n = 0; n < ASSET_POOL_PER_KIND; n++) {
      writeFileSync(join(PROOF_DIR, `${kind}-${n}.svg`), proofSvg(kind, n));
      proofCount++;
    }
  }

  console.log(`Demo assets generated: ${personas.length} avatars, ${proofCount} proof thumbnails.`);
  console.log(`  ${AVATAR_DIR}`);
  console.log(`  ${PROOF_DIR}`);
}

main();
