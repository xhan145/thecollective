/**
 * One-shot codemod: hardcoded brand hex -> semantic token utilities, and
 * ad-hoc font weights/sizes -> the 8-step type scale.
 *
 * Run:  node scripts/codemod-design-tokens.mjs [--dry]
 *
 * Safety rules (learned the hard way — a naive substring replace turned
 * `#11151d` into `var(--c-text)51d`):
 *  - hex matching is anchored to a full Tailwind arbitrary value `[#XXXXXX]`,
 *    never a bare substring;
 *  - anything not in the map is REPORTED, never guessed;
 *  - legacy surfaces are skipped entirely (see SKIP).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const DRY = process.argv.includes("--dry");
const ROOTS = ["app", "components"];

// Legacy pre-beta surfaces slated for removal (R8). Not part of the token system.
const SKIP = [
  "app/dashboard/", "app/feed-system/", "app/paths/", "app/setup/",
  "components/EmptyProofState", "components/EngagementActions", "components/FeedbackComposer",
  "components/FeedbackDisplay", "components/FeedCard", "components/MediaPickerCard",
  "components/MediaPreview", "components/MediaProofSwipe", "components/PracticeAreaSelector",
  "components/ProofComposer", "components/ProofMediaCard", "components/SetupChecklist",
  "components/TrustBadge", "components/UploadProgressBar", "components/VisibilitySelector",
  // OG/brand asset routes intentionally keep literal colours (no CSS vars in satori).
  "app/og.png", "opengraph-image", "icon.tsx", "apple-icon",
];

/** hex (uppercase, no #) -> token name used in `<prop>-<token>` */
const COLOR = {
  // core surfaces
  FFF8EE: "bg", FFFDF8: "surface", FFF1C7: "surface-soft", FFFFFF: "surface-input",
  F5EFE6: "surface-soft", F6F3EC: "surface-soft", F1ECE1: "surface-soft",
  F5EFE2: "surface-soft", F6F1E7: "surface", F2E9D8: "surface-soft", F1F0EC: "surface-soft",
  FFE7AE: "accent-soft", FFE9A8: "accent-soft", FFE8A0: "accent-soft",
  FFD986: "accent-soft", FFE080: "accent-soft", F6E7C8: "accent-soft",
  // text
  "111111": "content", "38322A": "secondary",
  "6E6E6E": "muted", "9B958B": "muted", "8F887E": "muted", "8D877F": "muted",
  B6AE9F: "subtle", C9C2B5: "subtle", C8C2B8: "subtle", E5DED4: "subtle",
  CFC6B5: "subtle", D9CDB8: "subtle", D8CBB0: "subtle", E0CFAE: "subtle", E0D3B4: "subtle",
  // accent
  F2A900: "accent", FFB000: "accent", FFC107: "accent",
  "7A5300": "accent-text", B07A00: "accent-text", "8A5D00": "accent-text", C8861A: "accent-text",
  // lines
  EFE7D8: "line", D6CDBC: "line",
  // status
  "22C55E": "success", "4CAF50": "success", "8FD3A8": "success",
  "15803D": "success-text", "17743B": "success-text",
  E8F8EE: "success-soft", EDF6F0: "success-soft", ECFDF3: "success-soft",
  E8F6EC: "success-soft", F7FEFA: "success-soft",
  C2413F: "danger", C0392B: "danger", DC2626: "danger", B91C1C: "danger", FF3D00: "danger",
  B4443F: "danger-text", C08A8A: "danger-text",
  FFF0F3: "danger-soft", FBE3E1: "danger-soft", F6CFCB: "danger-soft", FFB3C6: "danger-soft",
  EBF4FD: "info-soft", F5FAFF: "info-soft", "89C4E8": "info-soft", "1976D2": "info-soft",
};

// Dark-theme literals that now live only in the .dark token block.
const DARK_ONLY = new Set(["15110A", "211B12", "2C2413", "352D20", "1C1710", "B7AC99", "171B24", "11151D", "D8D4FF"]);

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

const unmapped = new Map();
let filesChanged = 0, colorHits = 0, typeHits = 0;

for (const root of ROOTS) {
  for (const file of walk(root)) {
    const rel = relative(".", file).replace(/\\/g, "/");
    if (SKIP.some((s) => rel.includes(s))) continue;

    const src = readFileSync(file, "utf8");
    let out = src;

    // ---- 1. colours: `prop-[#HEX]` and `prop-[#HEX]/opacity` ----
    out = out.replace(
      /\b(bg|text|border|ring|from|to|via|fill|stroke|decoration|outline|shadow|divide|placeholder|caret|accent)-\[#([0-9A-Fa-f]{6})\](\/\d{1,3})?/g,
      (full, prop, hex, alpha = "") => {
        const H = hex.toUpperCase();
        if (DARK_ONLY.has(H)) return full; // handled by the .dark token block
        const token = COLOR[H];
        if (!token) {
          const k = `#${H}`;
          unmapped.set(k, (unmapped.get(k) || 0) + 1);
          return full;
        }
        colorHits++;
        return `${prop}-${token}${alpha}`;
      },
    );

    // ---- 2. weights ----
    // The codebase already encodes an ordinal hierarchy (black > extrabold >
    // bold); preserve that ORDER while lowering the absolute values, so we get
    // real two-tier hierarchy instead of flattening everything to one weight.
    //   black/extrabold (emphasis) -> 600 semibold
    //   bold            (secondary) -> 500 medium
    const beforeType = out;
    out = out
      .replace(/\bfont-black\b/g, "font-semibold")
      .replace(/\bfont-extrabold\b/g, "font-semibold")
      .replace(/\bfont-bold\b/g, "font-medium");

    // ---- 3. sizes: ad-hoc -> scale tokens ----
    const SIZE = [
      [/\btext-\[(?:5[0-9]|4[0-9]|3[2-9])px\]/g, "text-display"],
      [/\btext-4xl\b|\btext-3xl\b/g, "text-display"],
      [/\btext-\[(?:2[4-9]|3[01])px\]/g, "text-title"],
      [/\btext-2xl\b/g, "text-title"],
      [/\btext-\[(?:1[89]|2[0-3])px\]/g, "text-heading"],
      [/\btext-xl\b|\btext-lg\b/g, "text-heading"],
      [/\btext-\[(?:1[67])px\]/g, "text-body-lg"],
      [/\btext-\[15px\]/g, "text-body"],
      [/\btext-base\b|\btext-sm\b/g, "text-body"],
      [/\btext-\[1[34]px\]/g, "text-label"],
      [/\btext-\[12px\]/g, "text-caption"],
      [/\btext-xs\b/g, "text-caption"],
      [/\btext-\[(?:9|10|11)px\]/g, "text-overline"],
    ];
    for (const [re, to] of SIZE) out = out.replace(re, to);
    if (out !== beforeType) typeHits++;

    if (out !== src) {
      filesChanged++;
      if (!DRY) writeFileSync(file, out, "utf8");
    }
  }
}

console.log(`${DRY ? "[dry] " : ""}files changed: ${filesChanged}`);
console.log(`colour classes rewritten: ${colorHits}`);
console.log(`files with type changes: ${typeHits}`);
if (unmapped.size) {
  console.log(`\nUNMAPPED hexes (left in place, resolve by hand):`);
  [...unmapped.entries()].sort((a, b) => b[1] - a[1]).forEach(([h, n]) => console.log(`  ${h}  x${n}`));
} else {
  console.log(`\nno unmapped hexes`);
}
