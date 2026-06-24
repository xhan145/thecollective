# TanStack Query (targeted adoption) — design

Date: 2026-06-24
Status: Approved (pending written-spec review)
Project: Collective web beta (Next.js App Router + Tailwind + Supabase)

## Problem

The app fetches all data through `BetaAppProvider` into one `snapshot` (via
`loadUserBundle`/`loadContent`), with optimistic local writes and Supabase Realtime
subscriptions. There is no client read-cache. Some reads — especially **signed GET URLs
for private media** — are re-derived on every render and would benefit from caching +
dedup. We want TanStack Query introduced **narrowly**, for cache-worthy server *reads*,
without disturbing the provider/snapshot/realtime/optimistic-write model everything else
relies on.

## Decision (locked during brainstorm)

- **Targeted adoption (approach A).** Add a single `QueryClient` + provider, and use
  `useQuery` only for server reads where caching/dedup/refetch help. First and primary
  consumer: **signed media GET URLs** (the `useEffect`-on-load video case). Read-only API
  GETs (feed pages, future metrics) may adopt the same pattern later.
- **Writes stay as-is** — provider optimistic update + Supabase write-through is untouched;
  no mutations routed through react-query in this pass.
- **Realtime stays authoritative** for live/push state (notifications, future coach
  messages). react-query is for cache-worthy *pull* reads only; the two never overlap on
  the same data.
- **No data-layer migration** of `loadUserBundle`/`loadContent`/snapshot.

## Architecture

- Provider order in `app/layout.tsx`: `ThemeProvider → QueryProvider → BetaAppProvider`
  (QueryProvider outside BetaAppProvider so the provider can use queries too).
- One `QueryClient` with calm defaults: `retry: 1`, `refetchOnWindowFocus: false`,
  `refetchOnReconnect: true`, per-query `staleTime`.
- Query-key factory module for consistent, invalidatable keys.

## Components

**New:**
- `components/QueryProvider.tsx` (`"use client"`) — creates the `QueryClient` (memoized via
  `useState(() => new QueryClient({...}))` so it is stable across renders) and renders
  `<QueryClientProvider>`. No Devtools in prod (optional dev-only import is out of scope).
- `lib/query/keys.ts` — key factories: `qk.signedUrl(bucket, path)` →
  `["signed-url", bucket, path]`. (Room for `qk.feed(page)`, `qk.metrics(userId)` later;
  only `signedUrl` is implemented now — YAGNI.)
- `lib/media/useSignedMediaUrl.ts` — `useSignedMediaUrl(bucket: string, path: string | null,
  opts?: { expiresIn?: number }): { url: string | null; isLoading: boolean; isError: boolean }`.
  Uses `useQuery({ queryKey: qk.signedUrl(bucket, path ?? ""), enabled: !!path, queryFn,
  staleTime: (expiresIn - 60) * 1000 })`. `queryFn` calls
  `supabase.storage.from(bucket).createSignedUrl(path, expiresIn)` (default `expiresIn = 3600`)
  and returns `data.signedUrl` (throws on error so react-query marks it errored). Never
  persisted to storage (signed URLs are sensitive + short-lived).
- `scripts/check-query-keys.ts` — runnable assertions that key factories are deterministic
  (same inputs → deep-equal arrays; different inputs → differ).

**Modified:**
- `app/layout.tsx` — wrap with `QueryProvider` in the order above.
- `package.json` — add `@tanstack/react-query`.

## Media playback (the `useEffect`/video case)

A media component (proof/coach private media) calls
`const { url } = useSignedMediaUrl(bucket, path)`. When `url` is ready it renders the
`<video src={url}>`; for video it autoplays **muted** (`muted` + `autoPlay` / or
`videoRef.play()` in an effect guarded on `url`) because browsers block unmuted autoplay.
Public proof media keeps using `getPublicUrl` (no signing/fetch) — this hook is for
**private** buckets (e.g. the future `coach-audio`) and any signed GET.

## Caching / expiry rules

- Signed URLs: `staleTime = (expiresIn - 60) * 1000` so a URL is reused across renders +
  components and only re-signed near expiry; `gcTime` left at default (or modestly above
  staleTime). Never persisted.
- Global defaults: `retry: 1`, `refetchOnWindowFocus: false`, `refetchOnReconnect: true`.

## Testing & verification

- `npx tsx scripts/check-query-keys.ts` — key-factory determinism (pass/print a confirmation line).
- `npm run typecheck` + `npm run build` green.
- Preview: a screen using `useSignedMediaUrl` for a private file → confirm a single signed-URL
  network call, cached on re-render (no refetch), and video autoplays muted; light + dark fine.

## Acceptance criteria

1. `@tanstack/react-query` installed; one `QueryProvider` wraps the app in order
   `ThemeProvider → QueryProvider → BetaAppProvider`.
2. `useSignedMediaUrl(bucket, path)` returns a cached, deduped signed GET URL (only re-signs
   near expiry) and drives muted video autoplay on load.
3. A query-key factory (`lib/query/keys.ts`) exists and is used by the hook; deterministic
   per the runnable check.
4. Provider/snapshot, Supabase Realtime, and all optimistic writes are unchanged; no mutations
   routed through react-query.
5. typecheck + build + the key check are green.

## Known limitations / next (own specs)

- No data-layer migration (`loadUserBundle`/`loadContent`/snapshot stay on the provider).
- No react-query mutations this pass.
- Read-API queries (feed pagination, metrics) adopt the same pattern later — metrics/score +
  spam detection belong to the parked **Trust System V2** spec (scored on contribution/trust
  signals, NOT likes/popularity, per the Phase 2 dossier rule "reward useful contribution
  rather than popularity").
- The **voice-coach** spec (parked at design Section 3) will consume `useSignedMediaUrl` for
  private coach-audio playback.
