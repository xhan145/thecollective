# Spam Enforcement — reversible content quarantine (design)

Date: 2026-06-24
Status: Approved (pending written-spec review)
Project: Collective web beta (Next.js App Router + Tailwind + Supabase)

## Problem

Trust V2 *measures* a per-profile `spam_signal` (0–100) but deliberately does NOT act on it
— it's surfaced read-only in the admin dashboard. We now want enforcement that protects
other members from an *active* spammer's content, without punishing a real beginner who
merely tripped the signal. The signal rises with grinding past daily caps and giving
feedback nobody finds useful: `least(100, over_cap_events*5 + (≥5 feedbacks given with
<20% helpful-ratio ? 40 : 0))`.

## Decisions (locked during brainstorm)

- **Tiered + reversible quarantine (B):** low/med signal stays admin-flagged (existing); at
  **high** signal, new outbound content is **held from others' feeds** — a reversible
  quarantine that protects others without blocking/punishing the user.
- **Conservative thresholds, new-content-only (A):** `SPAM_FLAG = 40` (admin visibility),
  `SPAM_QUARANTINE = 70` (auto-hold new content). Existing content untouched; never
  retroactive.
- **Silent + self-healing (A):** the author's own view is unchanged (no "flagged"/"pending"
  label, no shame); held content is withheld only from *others*. When the signal falls
  `< SPAM_FLAG`, non-removed held content **auto-releases** on the next recompute.
- **Server-enforced:** `held` is stamped by a BEFORE-INSERT trigger from the author's current
  signal — clients cannot set or bypass it. Admin `clear`/`remove` are SECURITY-DEFINER,
  admin-only.
- Scope is **content quarantine only** (proofs, tips, feedback) — no account warn/suspend/ban.

## Thresholds

In `lib/trust/trustV2.ts` (Node) — mirrored by the SQL trigger/recompute:
- `SPAM_FLAG = 40`, `SPAM_QUARANTINE = 70`.
- `isFlagged(signal) = signal >= 40`; `isQuarantined(signal) = signal >= 70`;
  `shouldAutoRelease(signal) = signal < 40`.

## Mechanism — migration `029_spam_enforcement.sql` (additive; after 028)

- Add to `public.proofs`, `public.practice_tips`, `public.feedback`:
  `held boolean not null default false`, `removed boolean not null default false`.
- **Quarantine triggers** — a BEFORE INSERT trigger on each table sets
  `NEW.held := coalesce((select spam_signal from public.profiles where id = NEW.<author>), 0) >= 70`.
  Author column: `proofs.user_id`, `practice_tips.author_id`, `feedback.author_id`. Stamped
  server-side from the *current* signal; client-supplied `held` is overwritten.
- **Self-heal in `_recompute_profile_counts`** (re-declared, same name/signature; only this
  addition vs 028): after computing `v_spam`, if `v_spam < 40`, run
  `update <each table> set held = false where <author> = p_uid and held = true and removed = false;`
  (admin-removed content never auto-returns).
- **Admin RPCs** (SECURITY DEFINER; `p_kind in ('proof','tip','feedback')` → maps to the table):
  - `clear_content(p_kind text, p_id uuid)` → `held = false` on the row.
  - `remove_content(p_kind text, p_id uuid)` → `held = true, removed = true`.
- Grants: both RPCs revoked from `public, anon, authenticated` (admin route uses service role).
  Indexes: `(<author>, held)` partial where `held` for the self-heal updates.
- Apply via MCP; `get_advisors(security)` clean.

## Read-path hiding (author always sees own; others don't see held)

All additive `.or(...)` clauses — no change to ranking/counts:
- **Proofs (feed):** `loadUserBundle` proofs query → `.or("held.eq.false,user_id.eq.<me>")`.
  `rankFeed` already excludes own, so a held proof only shows to its author.
- **Tips:** `listTips(promptId)` → `.or("held.eq.false,author_id.eq.<me>")`.
- **Feedback:** `loadUserBundle` feedback query → `.or("held.eq.false,author_id.eq.<me>")` —
  held feedback is hidden from the recipient + cohort (the author still sees what they wrote).
- Demo content defaults `held=false`, unaffected.

## Admin actions & UI

- New route `app/api/admin/moderation/route.ts` (`runtime="nodejs"`, `getAuthedUser` +
  `isAdminUser`, service role): `POST { action: 'clear'|'remove', kind, id }` → calls the
  matching RPC. Returns `{ ok }`.
- `app/admin/beta/route.ts` + `page.tsx`: the existing spam-review list gets, per flagged
  profile, a small **held-content** view (query that profile's `held=true` rows across the
  three tables) with **Clear** / **Remove** buttons calling the moderation route. Read-mostly,
  two explicit actions, beginner-safe framing ("held content", never "spammer").

## Testing & verification

- Pure (`npx tsx scripts/check-spam-enforcement.ts`): `isFlagged`/`isQuarantined`/
  `shouldAutoRelease` band boundaries (39/40/69/70).
- SQL (MCP, post-apply): insert as author signal ≥70 → `held=true`; as signal 0 → `held=false`;
  drop signal <40 + recompute → non-removed held flips false, `removed` stays held; role-switch
  → `clear_content`/`remove_content` not executable by `authenticated`; client-set `held=false`
  on insert is overwritten by the trigger. `get_advisors(security)` clean.
- Read-path: a held proof/tip/feedback absent from another user's bundle, present for the author.
- `npm run typecheck` + `npm run build` green.

## Acceptance criteria

1. Content created by an author at `spam_signal ≥ 70` is server-stamped `held` and hidden from
   everyone except the author across feed, tips, and feedback.
2. When an author's signal falls `< 40`, their non-removed held content auto-releases on the next
   recompute; admin-`removed` content never auto-returns.
3. Admins can Clear (release) or Remove (permanent hold) any held item via admin-only
   SECURITY-DEFINER RPCs; the admin UI lists a flagged user's held content with both actions.
4. Clients cannot set or bypass `held` (BEFORE-INSERT trigger stamps it server-side).
5. Silent + beginner-safe: no flag/pending/spam label shown to the author; existing content is
   never retroactively held.
6. Migration additive (010–028 untouched), `get_advisors` clean; pure + typecheck + build green.

## Build slices (for the plan)

1. **DB** — migration 029 (held/removed columns, triggers, recompute self-heal, clear/remove RPCs)
   applied via MCP; threshold constants + pure check in `lib/trust/trustV2.ts`.
2. **Read-path hiding** — the `.or(...)` filters in `loadUserBundle` (proofs + feedback) and
   `listTips`; verify others' held content is excluded, author's own is not.
3. **Admin moderation** — `/api/admin/moderation` route + held-content admin UI (Clear/Remove);
   docs; final verify.

## Scope — out (own follow-ups)

- Account-level moderation (warn / suspend / ban) — separate, heavier project.
- Tuning the `spam_signal` formula (that's Trust V2; this consumes it).
- User notification / appeals UI (intentionally silent + self-healing).
- Retroactive hiding of pre-existing content (new-content-only by design).
- ML/heuristic detection upgrades.

## Known limitations / next

- A determined spammer who keeps signal between 40–69 is flagged for admins but not auto-held;
  the conservative 70 bar is intentional (false-positive safety) and admin Remove covers the rest.
- The recompute self-heal runs on the user's own next action; a held item from a now-reformed user
  releases on their next recompute (or admin Clear) — acceptable.
- `removed` content is hard-hidden, not deleted (auditable; admins can still see it).
