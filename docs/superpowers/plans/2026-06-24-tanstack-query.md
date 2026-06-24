# TanStack Query (targeted) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce TanStack Query narrowly — one `QueryProvider` + a cached/deduped `useSignedMediaUrl` hook for private signed GET URLs (with muted video autoplay) — without touching the existing provider/snapshot/realtime/write model.

**Architecture:** Add `@tanstack/react-query` and a single client `QueryClient`. A query-key factory keeps keys consistent; `useSignedMediaUrl` wraps `supabase.storage.createSignedUrl` in `useQuery` with expiry-aware `staleTime`. Additive only — nothing consumes the hook yet, so existing behavior is unchanged.

**Tech Stack:** Next.js App Router + TypeScript, `@tanstack/react-query`, Supabase Storage, `npx tsx` for a runnable key check (no jest/vitest in repo).

## Global Constraints

- Targeted adoption only: provider/snapshot, Supabase Realtime, and optimistic writes are UNCHANGED; no mutations routed through react-query.
- Provider order in `app/layout.tsx`: `ThemeProvider → QueryProvider → BetaAppProvider` (QueryProvider is a `"use client"` component, outside BetaAppProvider).
- `QueryClient` defaults: `retry: 1`, `refetchOnWindowFocus: false`, `refetchOnReconnect: true`. Stable instance via `useState(() => new QueryClient(...))`.
- `qk.signedUrl(bucket, path)` ⇒ `["signed-url", bucket, path]`.
- `useSignedMediaUrl(bucket, path, opts?)`: `enabled: !!path`; default `expiresIn = 3600`; `staleTime = (expiresIn - 60) * 1000`; returns `{ url: string | null; isLoading: boolean; isError: boolean }`. Signed URLs NEVER persisted.
- Supabase browser client via `getSupabaseClient()` from `lib/supabase/client.ts`.
- Beginner-safe; nothing clout-related.
- Repo dir: `C:\Users\xhan1\OneDrive\Documents\New project\collective-v7-android-agent-prototype-local` (Git Bash). **Start on branch `tanstack-query` off `main`.**

## File Structure

- `lib/query/keys.ts` — **create.** Query-key factory `qk`. Pure.
- `scripts/check-query-keys.ts` — **create.** Runnable determinism assertions.
- `components/QueryProvider.tsx` — **create.** `"use client"` QueryClient provider.
- `app/layout.tsx` — **modify.** Wrap with `QueryProvider` in the required order.
- `lib/media/useSignedMediaUrl.ts` — **create.** The cached signed-GET hook.
- `package.json` — **modify.** Add `@tanstack/react-query`.

---

### Task 1: Query-key factory + runnable check

**Files:** Create `lib/query/keys.ts`, `scripts/check-query-keys.ts`

**Interfaces:**
- Produces: `qk.signedUrl(bucket: string, path: string): readonly ["signed-url", string, string]`.

- [ ] **Step 1: Create the branch**
```bash
cd "/c/Users/xhan1/OneDrive/Documents/New project/collective-v7-android-agent-prototype-local"
git checkout main && git checkout -b tanstack-query
```

- [ ] **Step 2: Create `lib/query/keys.ts`**
```ts
// Query-key factories — keep react-query keys consistent and invalidatable.
// Only signedUrl exists today (YAGNI); add feed/metrics keys when those reads adopt react-query.
export const qk = {
  signedUrl: (bucket: string, path: string) => ["signed-url", bucket, path] as const,
};
```

- [ ] **Step 3: Create `scripts/check-query-keys.ts`**
```ts
import assert from "node:assert";
import { qk } from "../lib/query/keys";

// deterministic: same inputs -> deep-equal arrays
assert.deepEqual(qk.signedUrl("coach-audio", "a/b"), qk.signedUrl("coach-audio", "a/b"), "stable for same inputs");
// distinct inputs -> different keys
assert.notDeepEqual(qk.signedUrl("coach-audio", "a/b"), qk.signedUrl("coach-audio", "a/c"), "path changes key");
assert.notDeepEqual(qk.signedUrl("coach-audio", "a/b"), qk.signedUrl("proof", "a/b"), "bucket changes key");
// shape
assert.deepEqual(qk.signedUrl("b", "p"), ["signed-url", "b", "p"], "expected shape");

console.log("query-keys checks passed");
```

- [ ] **Step 4: Run the check**
```bash
npx tsx scripts/check-query-keys.ts
```
Expected: `query-keys checks passed`.

- [ ] **Step 5: Typecheck + commit**
```bash
npm run typecheck
git add lib/query/keys.ts scripts/check-query-keys.ts
git commit -m "feat(query): query-key factory + runnable check"
```
Expected: typecheck clean.

---

### Task 2: Dependency + QueryProvider + layout wrap

**Files:** Modify `package.json`; Create `components/QueryProvider.tsx`; Modify `app/layout.tsx`

**Interfaces:**
- Produces: `<QueryProvider>` default export wrapping children with a stable `QueryClient`.

- [ ] **Step 1: Install the dependency**
```bash
npm install @tanstack/react-query
```
Expected: `@tanstack/react-query` added to `package.json` dependencies. (If a peer-dep warning appears, retry with `npm install @tanstack/react-query --legacy-peer-deps` and note it in the report.)

- [ ] **Step 2: Create `components/QueryProvider.tsx`**
```tsx
"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 3: Wrap `app/layout.tsx`** — add the import and nest QueryProvider between ThemeProvider and BetaAppProvider. Replace the existing provider block:
```tsx
        <ThemeProvider>
          <BetaAppProvider>
            <ServiceWorkerRegister />
            {children}
          </BetaAppProvider>
        </ThemeProvider>
```
with:
```tsx
        <ThemeProvider>
          <QueryProvider>
            <BetaAppProvider>
              <ServiceWorkerRegister />
              {children}
            </BetaAppProvider>
          </QueryProvider>
        </ThemeProvider>
```
And add the import near the other component imports at the top of the file:
```tsx
import QueryProvider from "@/components/beta/../QueryProvider";
```
> Use the correct path for where you created the file. If `QueryProvider.tsx` is at `components/QueryProvider.tsx`, the import is `import QueryProvider from "@/components/QueryProvider";`. Use that.

- [ ] **Step 4: Typecheck + build + commit**
```bash
npm run typecheck && npm run build 2>&1 | grep -iE "compiled|error|failed"
git add package.json package-lock.json components/QueryProvider.tsx app/layout.tsx
git commit -m "feat(query): add react-query + QueryProvider (ThemeProvider>QueryProvider>BetaAppProvider)"
```
Expected: typecheck clean; `✓ Compiled successfully`.

---

### Task 3: useSignedMediaUrl hook

**Files:** Create `lib/media/useSignedMediaUrl.ts`

**Interfaces:**
- Consumes: `qk.signedUrl` (Task 1), `QueryClientProvider` (Task 2), `getSupabaseClient` from `lib/supabase/client.ts`.
- Produces: `useSignedMediaUrl(bucket: string, path: string | null, opts?: { expiresIn?: number }): { url: string | null; isLoading: boolean; isError: boolean }`.

- [ ] **Step 1: Create `lib/media/useSignedMediaUrl.ts`**
```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client";
import { qk } from "@/lib/query/keys";

/**
 * Cached, deduped signed GET URL for a PRIVATE storage object. Returns a stable URL
 * reused across renders/components and only re-signed near expiry. For public media,
 * use getPublicUrl instead — this hook is for private buckets (e.g. coach-audio).
 */
export function useSignedMediaUrl(
  bucket: string,
  path: string | null,
  opts?: { expiresIn?: number },
): { url: string | null; isLoading: boolean; isError: boolean } {
  const expiresIn = opts?.expiresIn ?? 3600;
  const query = useQuery({
    queryKey: qk.signedUrl(bucket, path ?? ""),
    enabled: !!path,
    staleTime: (expiresIn - 60) * 1000,
    queryFn: async () => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase client unavailable");
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path as string, expiresIn);
      if (error || !data?.signedUrl) throw new Error(error?.message || "Could not sign media URL");
      return data.signedUrl;
    },
  });
  return { url: query.data ?? null, isLoading: query.isLoading, isError: query.isError };
}
```

- [ ] **Step 2: Typecheck + build**
```bash
npm run typecheck && npm run build 2>&1 | grep -iE "compiled|error|failed"
```
Expected: typecheck clean; `✓ Compiled successfully`.

- [ ] **Step 3: Re-run the key check (sanity)**
```bash
npx tsx scripts/check-query-keys.ts
```
Expected: `query-keys checks passed`.

- [ ] **Step 4: Commit**
```bash
git add lib/media/useSignedMediaUrl.ts
git commit -m "feat(media): useSignedMediaUrl — cached signed GET URL hook"
```

**Usage note (no code change this task — documents the consumer pattern):** a media component calls
`const { url } = useSignedMediaUrl(bucket, path);` and, once `url` is set, renders `<video src={url} muted autoPlay playsInline />` (or sets `videoRef.current.play()` in an effect guarded on `url`). Muted is required because browsers block unmuted autoplay. The hook is additive — no existing component imports it yet, so current media behavior is unchanged.

---

## Self-Review

**1. Spec coverage:**
- `@tanstack/react-query` dep + single `QueryProvider` in required order → Task 2. ✓
- `useSignedMediaUrl` cached/deduped signed GET + muted-autoplay usage → Task 3. ✓
- Query-key factory + runnable determinism check → Task 1. ✓
- Provider/snapshot/realtime/writes untouched; no mutations; URLs not persisted → Global Constraints + additive hook. ✓
- typecheck + build + key check green → Tasks 2 & 3. ✓

**2. Placeholder scan:** No TBD/TODO. Complete code in every code step. The layout import-path note resolves to the concrete `@/components/QueryProvider` path (file created at `components/QueryProvider.tsx`).

**3. Type consistency:** `qk.signedUrl(bucket, path)` defined Task 1, consumed Task 3 with identical signature. `useSignedMediaUrl` return shape `{url,isLoading,isError}` matches the spec. `QueryProvider` default export consumed in Task 2's layout edit. `getSupabaseClient` may return null — handled (throw) in the queryFn.
