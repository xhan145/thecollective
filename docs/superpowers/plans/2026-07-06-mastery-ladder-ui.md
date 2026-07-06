# Mastery Ladder UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (executed inline this session).

**Goal:** Surface the 120 live mastery levels: skill ladders with lock states on /practice, mastery fields on the proof screen, dead starter links resolved.
**Spec:** docs/superpowers/specs/2026-07-06-mastery-ladder-ui-design.md (committed 9da6fb3)
**Architecture:** pure progress module → presentational ladder components → two screen rebuilds → link resolution. No DB changes; Task D (server gate) out of scope.

## Global constraints
- Complete = proof submitted (existing `practice_completions` flow; no new completion machinery).
- Level N unlocked iff N==1 OR level N−1 of same skill complete; fallback (non-mastery) prompts always available.
- Locked = visible + gentle hint ("Finish '<prev>' first"), never hidden, never shame.
- Proof-type constraint keeps text as beginner-safe fallback; `mixed` = all types.
- Demo/local mode (snapshot.skills empty) keeps the current flat practice listing.
- Approved vocabulary; no likes/leaderboards; typecheck+build green before merge.

### Task 1 — `lib/mastery.ts` + `scripts/check-mastery.ts`
Pure functions: `levelStatus`, `skillProgress`, `directionProgress`, `nextMasteryStep`,
`resolveStarterPromptId`, `previousLevelName`. Check script asserts: L1 open; N locked
until N−1 complete; complete detection; fallback prompts always available; next-step
prefers current direction, skips completed, never returns locked; starter id never dead.
Run: `npx tsx scripts/check-mastery.ts` → "mastery checks passed".

### Task 2 — `components/beta/MasteryComponents.tsx`
`SkillLadderRow` (client; name, ●●○○○ dots, done/total, expand toggle) renders
`LevelRow`s (✓/open/lock icon, level_name, mastery_goal line, minutes+difficulty,
CTA → /proof/new/<slug> when available; locked hint otherwise). Depth classes from
the shipped elevation scale.

### Task 3 — `/practice` rebuild
Keep PageHeader, AiSupportCard + tips (keyed to the computed next step).
Mastery mode (skills present): HeroCard "Your next step" → per-direction sections
(title + N/20 Badge) → SkillLadderRows. Fallback mode: existing flat sections.
Remove the "For you" personalized block in mastery mode only.

### Task 4 — proof screen mastery surfacing
Level chip (skill • Level N · name) via skills lookup; masteryGoal panel;
doesNotCount + safetyNote notes; `ProofTypeSelector` gains `allowed` prop —
allowed = [proofType, "text"] (mixed/absent → all); success state shows
`next_step` + CTA to next unlocked level; locked-level visit → redirect /practice.

### Task 5 — starter-link resolution
`resolveStarterPromptId(snapshot)` replaces hardcoded conf-s1 in: AppShell FAB +
desktop sidebar; feed EmptyState CTA; passport empty link; /proof/new/page.tsx
(becomes client redirect); [promptId] param fallback.

### Verification
check-mastery + typecheck + build; preview (demo session loads live content):
ladder renders, locked hint, N/20 counts, proof-type filter, starter FAB target;
adversarial review workflow (logic, UX/brand, regressions) before merge.
