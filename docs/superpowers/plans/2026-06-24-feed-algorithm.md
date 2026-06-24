# Feed Algorithm (level-matched knowledge transfer) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat recency feed with a single blended stream ranked by shared interest × relative earned-level (favoring same / slightly-ahead, with some behind to help), each card showing a relationship cue + the right knowledge-transfer action.

**Architecture:** A pure `rankFeed` over existing snapshot data (`trustScore` on profiles, directions, `contextTags`, `usefulCountByProof`); `ProofCard` gains optional relationship/feedback-gate props; the feed page wires them. No new schema, no provider state changes.

**Tech Stack:** Next.js App Router + TypeScript, existing provider/snapshot, `npx tsx` pure check.

## Global Constraints

- **Level = earned trust tier.** `levelRank(profile)` = index of `trustLevelForPoints(profile.trustScore ?? 0)` in `[New, Practicing, Reliable, Helpful, Contributor]` → 0–4. Tiers: New<20, Practicing≥20, Reliable≥50, Helpful≥100, Contributor≥200.
- **Feedback-down gate:** Reliable+ (`levelRank ≥ 2`). Useful + learn-from open to everyone.
- **Pure ranking, deterministic** (no `Date.now`/random); never returns empty for non-empty input; **real proofs always rank above demo**; viewer's **own proofs excluded**; demo padding only when `shouldShowDemoActivity(realCount)`.
- **No new schema, no provider/repository changes.** Reuse existing `toggleUseful`/`isUseful`, `toggleLearnFrom`/`isLearningFrom`, and the existing feedback route.
- Beginner-safe copy; "behind" framed as "you're ahead here / help someone", never labeling the other person; **no ranks/scores/numbers rendered** — only the relative chip; no likes/followers/leaderboards/clout.
- Cards rendered outside the feed (no `relation` prop) must render exactly as today.
- Repo dir: `C:\Users\xhan1\OneDrive\Documents\New project\collective-v7-android-agent-prototype-local` (Git Bash). **Start on branch `feed-algorithm` off `main`.**

## File Structure

- `lib/betaTrust.ts` — **modify.** Add `levelRank`.
- `lib/feed/rankProofFeed.ts` — **create.** `RankedProof` + `rankFeed` (imports `shouldShowDemoActivity` from `lib/feedAlgorithm`).
- `scripts/check-feed-ranking.ts` — **create.** Runnable assertions.
- `components/beta/ProofComponents.tsx` — **modify.** `ProofCard` gains `relation?` + `canGiveFeedback?` props + chip/action row.
- `app/feed/page.tsx` — **modify.** Use `rankFeed` + pass props to each card.

## Reference (verified current shapes)

- `trustLevelForPoints(points)` in `lib/betaTrust.ts` (tiers above). `UserProfile.trustScore?`, `.currentDirectionId?`, `.directionIds`, `.contextTags?`. `Proof` has `userId`, `directionId`, `isDemo`, `contextTags?`, `createdAt`.
- `lib/feedAlgorithm.ts` already exports `shouldShowDemoActivity(realItemCount)` (keep; don't touch its Home-feed `FeedItem` code).
- `ProofCard({ proof, feedbackCount, authorName?, authorAvatarUrl? })` in `components/beta/ProofComponents.tsx:200`, wrapped in a `<Link href={\`/proof/${proof.id}\`}>`.
- Provider (`useBetaApp()`) exposes `toggleUseful(proofId, reason?)`, `isUseful(proofId)`, `toggleLearnFrom(teacherId)`, `isLearningFrom(teacherId)`.
- Feedback composer route: `app/proof/[id]/feedback/page.tsx`.

---

### Task 1: levelRank + rankFeed + pure check

**Files:** Modify `lib/betaTrust.ts`; Create `lib/feed/rankProofFeed.ts`, `scripts/check-feed-ranking.ts`

**Interfaces:**
- Produces: `levelRank(profile: { trustScore?: number | null }): number` (0–4);
  `type RankedProof = { proof: Proof; relation: "ahead" | "same" | "behind"; authorRank: number }`;
  `rankFeed(viewer: UserProfile, proofs: Proof[], authorsById: Record<string, UserProfile>, usefulCountByProof: Record<string, number>): RankedProof[]`.

- [ ] **Step 1: Branch**
```bash
cd "/c/Users/xhan1/OneDrive/Documents/New project/collective-v7-android-agent-prototype-local"
git checkout main && git checkout -b feed-algorithm
```

- [ ] **Step 2: Add `levelRank` to `lib/betaTrust.ts`** (after `trustLevelForPoints`):
```ts
const TRUST_TIERS = ["New", "Practicing", "Reliable", "Helpful", "Contributor"] as const;

/** 0–4 earned-level rank from a profile's trust points. Missing score => 0 (New). */
export function levelRank(profile: { trustScore?: number | null }): number {
  const label = trustLevelForPoints(profile.trustScore ?? 0);
  const i = TRUST_TIERS.indexOf(label as (typeof TRUST_TIERS)[number]);
  return i < 0 ? 0 : i;
}
```

- [ ] **Step 3: Create `lib/feed/rankProofFeed.ts`**
```ts
import type { Proof, UserProfile } from "@/lib/betaTypes";
import { levelRank } from "@/lib/betaTrust";
import { shouldShowDemoActivity } from "@/lib/feedAlgorithm";

export type FeedRelation = "ahead" | "same" | "behind";
export type RankedProof = { proof: Proof; relation: FeedRelation; authorRank: number };

const DEMO_LIMIT = 8;

function interestScore(viewer: UserProfile, proof: Proof): number {
  let s = 0;
  if (proof.directionId && proof.directionId === viewer.currentDirectionId) s += 5;
  else if (proof.directionId && viewer.directionIds?.includes(proof.directionId)) s += 1.5;
  else s += 0.1; // floor — kept, never dropped
  const vTags = viewer.contextTags ?? [];
  const pTags = proof.contextTags ?? [];
  if (vTags.length && pTags.length) s += pTags.filter((t) => vTags.includes(t)).length * 0.75;
  return s;
}

function levelScore(delta: number): number {
  if (delta === 1) return 3.5;
  if (delta === 0) return 3;
  if (delta === 2) return 2;
  if (delta === -1) return 2;
  if (delta >= 3) return 0.5;
  return 0.25; // delta <= -2
}

function usefulScore(count: number): number {
  return Math.min(count, 5) * 0.4;
}

function relationFor(delta: number): FeedRelation {
  return delta > 0 ? "ahead" : delta < 0 ? "behind" : "same";
}

/** Blended, deterministic feed ranking. Real proofs always above demo; own proofs excluded. */
export function rankFeed(
  viewer: UserProfile,
  proofs: Proof[],
  authorsById: Record<string, UserProfile>,
  usefulCountByProof: Record<string, number>,
): RankedProof[] {
  const viewerRank = levelRank(viewer);
  const rankOne = (proof: Proof): RankedProof & { score: number } => {
    const author = authorsById[proof.userId];
    const authorRank = author ? levelRank(author) : viewerRank;
    const delta = authorRank - viewerRank;
    const score =
      interestScore(viewer, proof) + levelScore(delta) + usefulScore(usefulCountByProof[proof.id] ?? 0);
    return { proof, relation: relationFor(delta), authorRank, score };
  };

  const sortTier = (list: Proof[]) =>
    list
      .map(rankOne)
      .sort((a, b) => b.score - a.score || (a.proof.createdAt < b.proof.createdAt ? 1 : -1))
      .map(({ proof, relation, authorRank }) => ({ proof, relation, authorRank }));

  const own = (p: Proof) => p.userId === viewer.id;
  const real = proofs.filter((p) => !p.isDemo && !own(p));
  const demo = proofs.filter((p) => p.isDemo && !own(p));

  const rankedReal = sortTier(real);
  if (!shouldShowDemoActivity(real.length)) return rankedReal;
  const limit = Math.max(0, DEMO_LIMIT - real.length) || (real.length === 0 ? DEMO_LIMIT : 0);
  const rankedDemo = sortTier(demo).slice(0, limit);
  return [...rankedReal, ...rankedDemo];
}
```

- [ ] **Step 4: Create `scripts/check-feed-ranking.ts`**
```ts
import assert from "node:assert";
import { rankFeed } from "../lib/feed/rankProofFeed";
import { levelRank } from "../lib/betaTrust";
import type { Proof, UserProfile } from "../lib/betaTypes";

const U = (id: string, trustScore: number, extra: Partial<UserProfile> = {}): UserProfile => ({
  id, displayName: id, initials: "X", role: "member", cohortId: "c", directionIds: ["direction-confidence"],
  createdAt: "2026-01-01", currentDirectionId: "direction-confidence", trustScore, ...extra,
});
const P = (id: string, userId: string, directionId: string, isDemo = false, createdAt = "2026-06-01"): Proof => ({
  id, userId, promptId: "p", directionId, title: id, body: "", mediaType: "text", attachments: [],
  status: "submitted", visibility: "private", feedbackIds: [], isDemo, createdAt,
} as Proof);

// levelRank tiers
assert.equal(levelRank({ trustScore: 0 }), 0, "New=0");
assert.equal(levelRank({ trustScore: 50 }), 2, "Reliable=2");
assert.equal(levelRank({ trustScore: 250 }), 4, "Contributor=4");
assert.equal(levelRank({}), 0, "missing=0");

const viewer = U("me", 50); // Reliable, rank 2
const authors: Record<string, UserProfile> = {
  ahead1: U("ahead1", 100), // rank 3 (d=+1)
  ahead3: U("ahead3", 250), // rank 4... d=+2; use a far one below
  same: U("same", 60),      // rank 2 (d=0)
  behind: U("behind", 0),   // rank 0 (d=-2)
  me: viewer,
};
const proofs: Proof[] = [
  P("pAhead1", "ahead1", "direction-confidence"),
  P("pSame", "same", "direction-confidence"),
  P("pBehind", "behind", "direction-confidence"),
  P("pOther", "same", "direction-momentum"),  // other direction -> lower interest
  P("pOwn", "me", "direction-confidence"),     // own -> excluded
];
const ranked = rankFeed(viewer, proofs, authors, {});

// own excluded
assert.ok(!ranked.some((r) => r.proof.id === "pOwn"), "own proof excluded");
// relation signs
assert.equal(ranked.find((r) => r.proof.id === "pAhead1")!.relation, "ahead", "ahead relation");
assert.equal(ranked.find((r) => r.proof.id === "pSame")!.relation, "same", "same relation");
assert.equal(ranked.find((r) => r.proof.id === "pBehind")!.relation, "behind", "behind relation");
// slightly-ahead (d=+1) outranks same-direction same-level? d=+1 (3.5) > d=0 (3)
const iAhead1 = ranked.findIndex((r) => r.proof.id === "pAhead1");
const iSame = ranked.findIndex((r) => r.proof.id === "pSame");
assert.ok(iAhead1 < iSame, "slightly-ahead outranks same-level");
// exact direction beats other direction
const iSame2 = ranked.findIndex((r) => r.proof.id === "pSame");
const iOther = ranked.findIndex((r) => r.proof.id === "pOther");
assert.ok(iSame2 < iOther, "exact direction beats other direction");
// never empty for non-empty input
assert.ok(ranked.length > 0, "non-empty");

// useful boost capped: a same-level proof with many usefuls rises but stays bounded
const ranked2 = rankFeed(viewer, [P("a", "same", "direction-confidence"), P("b", "same", "direction-confidence")], authors, { a: 100 });
assert.equal(ranked2[0].proof.id, "a", "useful boost orders within tier");

console.log("feed-ranking checks passed");
```

- [ ] **Step 5: Run + typecheck + commit**
```bash
npx tsx scripts/check-feed-ranking.ts
npm run typecheck
git add lib/betaTrust.ts lib/feed/rankProofFeed.ts scripts/check-feed-ranking.ts
git commit -m "feat(feed): levelRank + pure rankFeed (interest x level x useful) + check"
```
Expected: `feed-ranking checks passed`; typecheck clean.

---

### Task 2: ProofCard relationship chip + actions

**Files:** Modify `components/beta/ProofComponents.tsx`

**Interfaces:**
- Consumes: `FeedRelation` (Task 1); provider `toggleUseful`/`isUseful`/`toggleLearnFrom`/`isLearningFrom`.
- Produces: `ProofCard` accepts `relation?: FeedRelation` and `canGiveFeedback?: boolean`.

- [ ] **Step 1: Extend the `ProofCard` signature + render chip/actions.** Change the signature to:
```tsx
export function ProofCard({ proof, feedbackCount, authorName, authorAvatarUrl, relation, canGiveFeedback }: { proof: Proof; feedbackCount: number; authorName?: string; authorAvatarUrl?: string; relation?: import("@/lib/feed/rankProofFeed").FeedRelation; canGiveFeedback?: boolean }) {
```
Add provider hooks at the top of the component body:
```tsx
  const { isUseful, toggleUseful, isLearningFrom, toggleLearnFrom } = useBetaApp();
  const useful = isUseful(proof.id);
  const learning = isLearningFrom(proof.userId);
```
(Ensure `import { useBetaApp } from "@/components/beta/AppStateProvider";` is present.)

- [ ] **Step 2: Render the relationship chip** inside the card (near the author byline), only when `relation` is set:
```tsx
  {relation && (
    <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
      relation === "ahead" ? "bg-[#FFF1C7] text-[#7A5300]" : relation === "behind" ? "bg-[#FFF8EE] text-[#6E6E6E]" : "bg-[#F1F0EC] text-[#6E6E6E]"
    }`}>
      {relation === "ahead" ? "▲ Learn from" : relation === "behind" ? "▼ You're ahead here" : "● Around your level"}
    </span>
  )}
```

- [ ] **Step 3: Render the action row** at the card footer, only when `relation` is set. Actions sit inside the card's `<Link>`, so each handler calls `e.preventDefault(); e.stopPropagation();` before toggling. "Give feedback" is a plain link to the feedback composer:
```tsx
  {relation && (
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleUseful(proof.id); }}
        className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${useful ? "bg-[#FFE7AE] text-[#7A5300]" : "border border-[#EFE7D8] bg-[#FFFDF8] text-[#6E6E6E]"}`}>
        {useful ? "✓ Useful" : "Useful"}
      </button>
      {relation !== "behind" && (
        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleLearnFrom(proof.userId); }}
          className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${learning ? "bg-[#FFE7AE] text-[#7A5300]" : "border border-[#EFE7D8] bg-[#FFFDF8] text-[#6E6E6E]"}`}>
          {learning ? "✓ Learning from" : "Learn from"}
        </button>
      )}
      {relation === "behind" && canGiveFeedback && (
        <Link href={`/proof/${proof.id}/feedback`} onClick={(e) => e.stopPropagation()}
          className="rounded-full border border-[#EFE7D8] bg-[#FFFDF8] px-3 py-1.5 text-xs font-extrabold text-[#6E6E6E]">
          Give feedback
        </Link>
      )}
    </div>
  )}
```
(If `Link` is already imported in this file — it is, for the card wrapper — reuse it. Nested `<a>` inside the card `<Link>` is acceptable here because the inner link `stopPropagation`s; if Next/React warns about nested anchors during build, convert the card wrapper click to a `useRouter().push` on the outer container instead — note any such change in the report.)

- [ ] **Step 4: Typecheck + build + commit**
```bash
npm run typecheck && npm run build 2>&1 | grep -iE "compiled|error|failed"
git add components/beta/ProofComponents.tsx
git commit -m "feat(feed): ProofCard relationship chip + useful/learn-from/feedback actions"
```
Expected: typecheck clean; compiled. (If nested-anchor hydration error appears in build, apply the router fallback from Step 3 and re-run.)

---

### Task 3: Wire the feed page + verify

**Files:** Modify `app/feed/page.tsx`

- [ ] **Step 1: Replace the flat list with `rankFeed`.** New body:
```tsx
"use client";

import { AppShell } from "@/components/beta/AppShell";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { ProofCard } from "@/components/beta/ProofComponents";
import { ButtonLink, EmptyState, PageHeader, SectionLabel } from "@/components/beta/ui";
import { MotionItem, MotionList } from "@/components/beta/motion";
import { rankFeed } from "@/lib/feed/rankProofFeed";
import { levelRank } from "@/lib/betaTrust";

export default function FeedPage() {
  const { snapshot, currentUser, getFeedbackForProof } = useBetaApp();
  const userFor = (userId: string) => snapshot.users.find((u) => u.id === userId);
  const authorsById = Object.fromEntries(snapshot.users.map((u) => [u.id, u]));
  const viewer = currentUser ?? snapshot.users.find((u) => u.id === snapshot.currentUserId) ?? snapshot.users[0];
  const ranked = viewer ? rankFeed(viewer, snapshot.proofs, authorsById, snapshot.usefulCountByProof) : [];
  const canGiveFeedback = viewer ? levelRank(viewer) >= 2 : false;
  const realCount = snapshot.proofs.filter((p) => !p.isDemo && p.userId !== viewer?.id).length;

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Feed" subtitle="Learn from people ahead, share with people behind. Usefulness over attention." />
        {ranked.length > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-[#FFF1C7] px-4 py-2 text-xs font-extrabold text-[#7A5300]">
            <span className="inline-block h-2 w-2 rounded-full bg-[#22C55E]" />
            {realCount > 0 ? `${realCount} real proof${realCount === 1 ? "" : "s"} shown first` : "No real proof yet. Here are example proofs to help you start."}
          </div>
        )}
        <section className="space-y-3">
          <SectionLabel title="For you" />
          {ranked.length ? (
            <MotionList className="space-y-3">
              {ranked.map(({ proof, relation }) => (
                <MotionItem key={proof.id}>
                  <ProofCard
                    proof={proof}
                    feedbackCount={getFeedbackForProof(proof.id).length}
                    authorName={userFor(proof.userId)?.displayName}
                    authorAvatarUrl={userFor(proof.userId)?.avatarUrl}
                    relation={relation}
                    canGiveFeedback={canGiveFeedback}
                  />
                </MotionItem>
              ))}
            </MotionList>
          ) : (
            <EmptyState title="No proof yet" body="No real proof yet. Here are example proofs to help you start." cta={<ButtonLink href="/proof/new/conf-s1">Submit proof</ButtonLink>} />
          )}
        </section>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 2: Full verification**
```bash
npx tsx scripts/check-feed-ranking.ts
npm run typecheck
npm run build 2>&1 | grep -iE "compiled|error|failed"
```
Expected: `feed-ranking checks passed`; typecheck clean; `✓ Compiled successfully`.

- [ ] **Step 3: Commit**
```bash
git add app/feed/page.tsx
git commit -m "feat(feed): level-matched ranked feed with relationship cues + gated feedback"
```

- [ ] **Step 4: Preview check (eval-based; screenshot flaky).** Confirm via preview: the feed renders ranked cards with relationship chips; in the demo (`user-alex`) the actions render; toggle dark mode for legibility. (No behavior change to Home, which renders `ProofCard` without `relation`.)

---

## Self-Review

**1. Spec coverage:**
- Level = earned trust tier via `levelRank` → Task 1. ✓
- Blended ranked `rankFeed` (interest spine + contextTags + bleed × relative level × capped useful; real-over-demo; own excluded; never empty) → Task 1. ✓
- Per-card chip + actions; feedback-down gated Reliable+; useful/learn-from open → Tasks 2 & 3. ✓
- Active-direction spine + light bleed + contextTags → `interestScore`. ✓
- No new schema/provider; backward-compatible cards (no `relation` ⇒ unchanged) → Task 2. ✓
- Beginner-safe, no numbers/clout rendered → chip copy + no counts. ✓
- Pure + typecheck + build green → Tasks 1 & 3. ✓

**2. Placeholder scan:** No TBD/TODO. Complete code in every step. The nested-anchor note gives a concrete fallback (router.push), not a vague "handle edge cases."

**3. Type consistency:** `levelRank(profile)` defined Task 1, used in `rankFeed` + feed page + (via `canGiveFeedback`) Task 3. `RankedProof`/`FeedRelation` defined Task 1, consumed Tasks 2 & 3. `rankFeed(viewer, proofs, authorsById, usefulCountByProof)` signature identical across def + call site. `ProofCard` new optional props match what the feed passes. Provider selectors (`isUseful`/`toggleUseful`/`isLearningFrom`/`toggleLearnFrom`) used in Task 2 are the existing context methods.
