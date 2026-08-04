/**
 * Follow-up pass: remove redundant explicit weights where a type-scale token
 * already defines one.
 *
 * Why: the first codemod mapped weights ordinally (extrabold->600, bold->500).
 * Where the old code used extrabold on small copy and bold on a heading, that
 * produced INVERTED hierarchy (verified live: h1 at 500, <p> at 600).
 *
 * The scale is the source of truth: display/title/heading = 600, label/overline
 * = 500, body/body-lg/caption = 400. So inside any class list that uses one of
 * those tokens, an explicit font-medium/font-semibold is dropped.
 *
 * Run: node scripts/codemod-weight-cleanup.mjs [--dry]
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const DRY = process.argv.includes("--dry");
const ROOTS = ["app", "components"];
const SKIP = [
  "app/dashboard/", "app/feed-system/", "app/paths/", "app/setup/",
  "components/AppShell.tsx", "components/ProofCard.tsx",
  "components/EmptyProofState", "components/EngagementActions", "components/FeedbackComposer",
  "components/FeedbackDisplay", "components/FeedCard", "components/MediaPickerCard",
  "components/MediaPreview", "components/MediaProofSwipe", "components/PracticeAreaSelector",
  "components/ProofComposer", "components/ProofMediaCard", "components/SetupChecklist",
  "components/TrustBadge", "components/UploadProgressBar", "components/VisibilitySelector",
  "opengraph-image", "apple-icon", "icon.tsx",
];

// Scale tokens that already carry a fontWeight in tailwind.config.ts
const WEIGHTED = /text-(?:display|title|heading|label|overline)\b/;

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

let files = 0, removed = 0;
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const rel = relative(".", file).replace(/\\/g, "/");
    if (SKIP.some((s) => rel.includes(s))) continue;
    const src = readFileSync(file, "utf8");

    // Operate on individual quoted/backticked class strings so we never reach
    // across unrelated code.
    const out = src.replace(/(["'`])((?:[^"'`\\\n]|\\.)*?)\1/g, (full, q, body) => {
      if (!WEIGHTED.test(body)) return full;
      if (!/\bfont-(medium|semibold)\b/.test(body)) return full;
      const cleaned = body
        .replace(/\bfont-(?:medium|semibold)\b\s*/g, "")
        .replace(/\s{2,}/g, " ")
        .replace(/\s+(["'`])/g, "$1")
        .trimEnd();
      const n = (body.match(/\bfont-(?:medium|semibold)\b/g) || []).length;
      removed += n;
      return `${q}${cleaned}${q}`;
    });

    if (out !== src) {
      files++;
      if (!DRY) writeFileSync(file, out, "utf8");
    }
  }
}
console.log(`${DRY ? "[dry] " : ""}files: ${files}, redundant weight classes removed: ${removed}`);
