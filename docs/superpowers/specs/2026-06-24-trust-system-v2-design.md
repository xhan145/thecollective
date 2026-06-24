# Trust System V2 — earned, quality-weighted, 4-dimension trust (design)

Date: 2026-06-24
Status: Approved (pending written-spec review)
Project: Collective web beta (Next.js App Router + Tailwind + Supabase)

## Problem

V1 trust is a single monotonic sum (`trust_score = Σ points` over `trust_events`),
written only through SECURITY-DEFINER RPCs. Point values: proof 5, practice 5,
peer-feedback 3, helpful 7, accepted-contribution 15; tiers New<20 / Practicing≥20 /
Reliable≥50 / Helpful≥100 / Contributor≥200. The feed and contributor-gating now lean on
this score, but it is **farmable**: peer-feedback pays +3 regardless of quality (spam
feedback earns trust), proofs/practices pay flat with no volume limit, and nothing rewards
*consistency*. The Phase 2 dossier defines a 4-type trust model (Practice / Feedback /
Consistency / Contribution) and the product goal is "reward useful contribution rather than
popularity" with trust that's earned, not farmed. V2 makes the score trustworthy and
structured so everything built on it (feed level, feedback-down gating) is honest.

## Decisions (locked during brainstorm)

- **Scope C, integrity-first:** both quality-weighted integrity AND the 4-dimension model,
  one coherent V2; build the integrity layer so dimensions sit on honest data.
- **Weighted rollup (A):** `trust_score = Practice×1 + Feedback×1.5 + Consistency×1 + Contribution×2`,
  mapped by the existing New→Contributor tiers (re-tuned to the new distribution).
- **Integrity (A):** feedback pays on usefulness (submit +1, useful +6) + daily soft caps
  (diminishing returns; full up to a per-type cap, 0 beyond, still recorded).
- **Consistency (A):** rolling last-8-weeks active-week count, no streak/shame; the other
  three dimensions are cumulative and never decay.
- **Spam (A):** compute a non-punitive `spam_signal`, surface to admins for review only — no
  auto-penalty in V2 (the enforcement tool is a future project).
- All changes stay inside SECURITY-DEFINER RPCs (clients can't mint trust); additive
  migration; 010–026 untouched.

## Dimension model

Computed at recompute from `trust_events` (categorized by `type`) + timestamps:
- **Practice** = Σ points of `practice` + `proof`.
- **Feedback** = Σ points of `peer-feedback` + `helpful`.
- **Contribution** = Σ points of `accepted-contribution`.
- **Consistency** = `min(activeWeeks_in_last_8, 8) × 4` (0–32), where an active week = an ISO
  week in the last 8 with ≥1 trust event for the user.

`trust_score = practice_trust×1 + feedback_trust×1.5 + consistency_trust×1 + contribution_trust×2`
(rounded to int). Tier function unchanged in shape; thresholds re-tuned after observing the
recomputed distribution (calibration step — start with current thresholds, adjust if levels
swing).

## Integrity mechanics (in the RPCs)

- **Feedback rebalance:** `peer-feedback` 3 → **1** (on submit); `helpful` 7 → **6** (recipient
  marks useful). Spam feedback ≈ +1; useful feedback = 1 + 6 = 7. proof 5 / practice 5 /
  accepted-contribution 15 unchanged.
- **Daily soft caps (diminishing returns):** proof ≤ 3/day, practice ≤ 3/day,
  peer-feedback ≤ 5/day. Implemented by counting today's same-type events for the user inside
  the RPC; over cap → insert the event with `points = 0` (recorded for history, no trust).
  `helpful` + `accepted-contribution` are recipient/owner-triggered → uncapped.

## Data model — migration `027_trust_v2.sql` (additive; after 026)

- `profiles` += `practice_trust int not null default 0`, `feedback_trust int not null default 0`,
  `consistency_trust int not null default 0`, `contribution_trust int not null default 0`,
  `spam_signal int not null default 0`. (`trust_score` exists; now holds the weighted blend.)
- Replace function BODIES (same names/signatures, SECURITY DEFINER, revoked from
  public/anon/authenticated) — never editing the 023/024 migration files:
  - `record_proof_trust`, `record_practice_trust(text)` → add daily-cap check.
  - `record_feedback_trust` → award 1, capped 5/day.
  - `mark_feedback_helpful` → award 6 to the feedback author.
  - new `_recompute_trust_v2(p_uid uuid)` (or extend `_recompute_profile_counts`) → compute the
    4 sub-scores + Consistency + `spam_signal` + weighted `trust_score`; write all to the
    profile. Every record fn calls it at the end.
- **Spam signal** computed in recompute from cheap heuristics (0–100): low helpful-ratio on
  feedback given, rapid-fire bursts (many same-type events in a short window), near-empty proof
  bodies. Stored only; never affects trust/visibility in V2.
- **Backfill:** at the end of the migration, run the recompute for every existing profile so
  live tiers reflect V2 immediately.

## Admin surface

Extend `app/api/admin/beta/route.ts` + the admin dashboard with a read-only "spam review" list
(profiles ordered by `spam_signal` desc). No auto-action; eyes-on review only.

## Testing & verification

- Pure (`npx tsx scripts/check-trust-v2.ts`) against a Node mirror of the scoring logic:
  weighted rollup math; feedback rebalance (submit 1 / helpful 6); daily-cap diminishing (3rd
  proof full, 4th → 0); consistency window (active weeks → score; weeks roll off after 8);
  spam heuristic ordering. (Node mirror = canonical tested copy; the SQL functions are the
  runtime copy — same Node/SQL parity discipline as the coach policy.)
- SQL (via MCP `execute_sql`, after apply): role-switched checks that anon/authenticated still
  cannot call the helpers; a scripted sequence — 5 feedbacks where only useful ones boost the
  author; 4 proofs same day where the 4th adds 0; a backfilled profile shows non-null
  sub-scores. `get_advisors(security)` clean.
- `npm run typecheck` + `npm run build` green.
- After apply: inspect the recomputed `trust_score` distribution; re-tune tier thresholds if a
  large share of users jumped/dropped tiers.

## Acceptance criteria

1. Profile carries the 4 dimension sub-scores + `spam_signal`; `trust_score` is the weighted
   blend; tiers reflect it.
2. Feedback pays on usefulness (submit +1, useful +6); daily soft caps apply (full→0 beyond
   cap) for proof/practice/feedback; helpful/contribution uncapped.
3. Consistency is a rolling last-8-weeks no-shame signal; the other three never decay.
4. `spam_signal` is measured and admin-surfaced; it never auto-penalizes trust or hides
   content in V2.
5. All writes via SECURITY-DEFINER RPCs; anon/authenticated cannot call the helpers; clients
   cannot mint trust.
6. Migration additive (010–026 untouched), backfilled; `get_advisors` clean; tiers re-tuned to
   the new distribution.
7. Pure + typecheck + build green.

## Scope — out (own follow-ups)

- The automated spam-enforcement tool (consumes `spam_signal`).
- Cohorts + contributor-role titles (Practitioner→Steward) from the dossier.
- Any feed change — the feed already consumes `trust_score` and improves automatically.
- Historical trust-event recategorization beyond the backfill recompute.
- A trust-history/breakdown UI beyond the simple profile readout of the 4 sub-scores.

## Known limitations / next

- Consistency for a dormant user is stale until their next action (recompute is action-driven);
  acceptable — it self-heals on return.
- Tier thresholds need one calibration pass post-apply (weighted blend changes magnitudes).
- Spam heuristics are intentionally coarse + non-enforcing; the real detector is later work.
