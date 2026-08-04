/**
 * Design-system guard. Run: `npm run check:design`
 *
 * This is the anti-regression mechanism for the design foundation. It fails on:
 *   1. hardcoded hex colours in Tailwind arbitrary values (live surfaces only)
 *   2. banned font weights (font-black / font-extrabold) and ad-hoc text-[Npx]
 *   3. any semantic token pair whose WCAG contrast drops below AA
 *
 * (3) is computed, never eyeballed — the three failures this foundation fixed
 * (#9B958B at 2.92, gold-as-text at 1.98, dark borders at 1.26) were all
 * invisible until someone actually did the arithmetic.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOTS = ["app", "components"];

/**
 * Legacy pre-beta surfaces (old dark/purple design) scheduled for deletion under
 * the R8 legacy-route cleanup. They are NOT part of the semantic token system.
 * Do not add live surfaces here — tokenize them instead.
 */
const ALLOW = [
  "app/dashboard/", "app/feed-system/", "app/paths/", "app/setup/",
  "components/AppShell.tsx",        // legacy shell chrome (one navy value)
  "components/ProofCard.tsx",       // orphaned, no importers
  "components/EmptyProofState", "components/EngagementActions", "components/FeedbackComposer",
  "components/FeedbackDisplay", "components/FeedCard", "components/MediaPickerCard",
  "components/MediaPreview", "components/MediaProofSwipe", "components/PracticeAreaSelector",
  "components/ProofComposer", "components/ProofMediaCard", "components/SetupChecklist",
  "components/TrustBadge", "components/UploadProgressBar", "components/VisibilitySelector",
  // Brand/OG image routes render via satori, which cannot resolve CSS variables.
  "opengraph-image", "apple-icon", "icon.tsx",
];

const HEX_CLASS =
  /\b(?:bg|text|border|ring|from|to|via|fill|stroke|decoration|outline|shadow|divide|placeholder|caret|accent)-\[#[0-9A-Fa-f]{3,8}\](?:\/\d{1,3})?/g;
const BANNED_WEIGHT = /\bfont-(?:black|extrabold)\b/g;
const ADHOC_SIZE = /\btext-\[\d+(?:\.\d+)?px\]/g;

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

const violations: string[] = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const rel = relative(".", file).replace(/\\/g, "/");
    if (ALLOW.some((a) => rel.includes(a))) continue;
    const src = readFileSync(file, "utf8");
    for (const [re, label] of [
      [HEX_CLASS, "hardcoded hex"],
      [BANNED_WEIGHT, "banned font weight"],
      [ADHOC_SIZE, "ad-hoc font size"],
    ] as const) {
      const hits = src.match(re);
      if (hits) {
        for (const h of [...new Set(hits)]) violations.push(`  ${rel}: ${label} \`${h}\``);
      }
    }
  }
}

// ---------- contrast ----------
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const css = readFileSync("app/globals.css", "utf8");
function tokens(scope: "root" | "dark"): Record<string, string> {
  // Grab the semantic block (the one that defines --c-bg), light or dark.
  const re =
    scope === "root"
      ? /:root\s*\{[^}]*?--c-bg:[^}]*\}/s
      : /\.dark\s*\{[^}]*?--c-bg:[^}]*\}/s;
  const block = css.match(re)?.[0] ?? "";
  const map: Record<string, string> = {};
  for (const m of block.matchAll(/(--c-[a-z-]+):\s*(#[0-9A-Fa-f]{6})/g)) map[m[1]] = m[2];
  return map;
}

// [foreground, background, minimum ratio, description]
const PAIRS: [string, string, number, string][] = [
  ["--c-text", "--c-bg", 4.5, "primary text on bg"],
  ["--c-text", "--c-surface", 4.5, "primary text on surface"],
  ["--c-text-secondary", "--c-surface", 4.5, "secondary text on surface"],
  ["--c-text-muted", "--c-surface", 4.5, "muted text on surface"],
  ["--c-text-subtle", "--c-surface", 4.5, "subtle text on surface"],
  ["--c-text", "--c-surface-soft", 4.5, "primary text on soft surface"],
  ["--c-accent-text", "--c-surface", 4.5, "accent text on surface"],
  ["--c-accent-text", "--c-surface-soft", 4.5, "accent text on soft surface"],
  ["--c-success-text", "--c-success-soft", 4.5, "success text on success soft"],
  ["--c-danger-text", "--c-danger-soft", 4.5, "danger text on danger soft"],
  ["--c-line", "--c-surface", 1.4, "border vs surface (non-text, must be visible)"],
];

const contrastFails: string[] = [];
for (const scope of ["root", "dark"] as const) {
  const t = tokens(scope);
  if (!Object.keys(t).length) {
    contrastFails.push(`  could not parse ${scope} token block from app/globals.css`);
    continue;
  }
  for (const [fg, bg, min, desc] of PAIRS) {
    if (!t[fg] || !t[bg]) {
      contrastFails.push(`  [${scope}] missing token ${!t[fg] ? fg : bg}`);
      continue;
    }
    const r = ratio(t[fg], t[bg]);
    if (r < min) {
      contrastFails.push(
        `  [${scope}] ${desc}: ${t[fg]} on ${t[bg]} = ${r.toFixed(2)} (needs >=${min})`,
      );
    }
  }
}

let failed = false;
if (violations.length) {
  failed = true;
  console.error(`\n✖ ${violations.length} design-token violation(s):`);
  console.error(violations.join("\n"));
  console.error(
    "\n  Use semantic utilities (bg-surface, text-muted, border-line) and the type\n" +
      "  scale (text-body, text-heading...). See docs/superpowers/specs/2026-07-26-design-foundation-design.md",
  );
}
if (contrastFails.length) {
  failed = true;
  console.error(`\n✖ ${contrastFails.length} contrast failure(s):`);
  console.error(contrastFails.join("\n"));
}
if (failed) process.exit(1);

console.log("design tokens: no hardcoded colours, no banned weights/sizes");
console.log(`contrast: all ${PAIRS.length} token pairs pass in both themes`);
