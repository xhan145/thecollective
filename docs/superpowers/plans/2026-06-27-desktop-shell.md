# Desktop Shell & Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make `components/beta/AppShell.tsx` responsive — unchanged phone UI below `lg`, a left sidebar + centered wide content at `lg+` — per `docs/superpowers/specs/2026-06-27-desktop-shell-design.md`.

**Architecture:** One `AppShell`. Shared `NAV_ITEMS` + small control components feed both a `lg:hidden` mobile chrome (today's header + BottomNav) and a `hidden lg:flex` `DesktopSidebar`. Content renders in a responsive container (`max-w-[430px]` cap only below lg; centered `max-w-4xl` at lg+). Auth/redirect/loading logic unchanged.

**Tech Stack:** Next.js App Router (client), TS, Tailwind, framer-motion, lucide-react, existing `useTheme`/`useBetaApp`/`CollectiveWordmark`/`Badge`.

## Global Constraints

- Mobile (< lg, ≤1023px) experience must be **pixel-identical** to current.
- Theme tokens only: cream #FFF8EE / surface #FFFDF8 / soft #FFF1C7 / ink #111111 / muted #8D877F,#6E6E6E / line #EFE7D8 / gold #F2A900. Dark mode must read (existing `.dark` remap covers these literals + `var(--c-*)`).
- No routing/auth/redirect logic changes; no screen-content changes.
- Proof CTA target: `/proof/new/conf-s1`. Nav destinations: Home `/home`, Practice `/practice`, Feed `/feed`, Profile `/profile`.
- Verify per task: `npm run typecheck` + `npm run build` clean.
- No new deps.

---

### Task 1: Shared nav config + control components (no visual change)

**Files:**
- Modify: `components/beta/AppShell.tsx`

**Interfaces:**
- Produces (module-level, same file): `NAV_ITEMS` array; `ThemeToggleButton`, `NotificationsButton` components. The existing mobile header + `BottomNav` are refactored to consume them. No exports change; no visual change.

- [ ] **Step 1: Add shared `NAV_ITEMS` + control components near the top of `components/beta/AppShell.tsx`** (after imports, before `AppShell`):

```tsx
const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/practice", label: "Practice", icon: BookOpen },
  { href: "/feed", label: "Feed", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: User },
] as const;

function ThemeToggleButton({ className = "" }: { className?: string }) {
  const { resolved, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
      aria-label={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`grid h-10 w-10 place-items-center rounded-full bg-[var(--surface,#FFFDF8)] text-[var(--ink,#111111)] shadow-[0_6px_16px_rgba(71,52,18,0.08)] ${className}`}
    >
      {resolved === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

function NotificationsButton({ unread, className = "" }: { unread: number; className?: string }) {
  return (
    <Link
      href="/notifications"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      className={`relative grid h-10 w-10 place-items-center rounded-full bg-[var(--surface,#FFFDF8)] text-[var(--ink,#111111)] shadow-[0_6px_16px_rgba(71,52,18,0.08)] ${className}`}
    >
      <Bell size={18} />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#F2A900] px-1 text-[10px] font-black text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
```

- [ ] **Step 2: Refactor the existing header** to use the shared controls. Replace the header's inline theme `<button>` and notifications `<Link>` (the two existing controls inside `<div className="flex items-center gap-2">`) with `<ThemeToggleButton />` and `<NotificationsButton unread={unread} />`. Keep the demo/mock badge line exactly as-is. The header keeps `useTheme`/`unread` available via the existing component scope (ThemeToggleButton reads `useTheme` itself, so the `const { resolved, setTheme } = useTheme();` line in `AppShell` can be removed if now unused — verify with grep before removing).

- [ ] **Step 3: Refactor `BottomNav`** to map over `NAV_ITEMS` instead of its local `items` array (delete the local `const items = [...]`; use `NAV_ITEMS`). Markup/classes unchanged otherwise.

- [ ] **Step 4: Verify no visual change + clean**

Run: `npm run typecheck` — Expected: clean.
Run: `npm run build 2>&1 | tail -20` — Expected: compiles.
Confirm: `grep -n "const items = \[" components/beta/AppShell.tsx` returns nothing (local array removed); `grep -c "NAV_ITEMS" components/beta/AppShell.tsx` ≥ 2.

- [ ] **Step 5: Commit**

```bash
git add components/beta/AppShell.tsx
git commit -m "refactor(shell): shared NAV_ITEMS + theme/notifications controls (no visual change)"
```

---

### Task 2: Responsive sidebar + content container

**Files:**
- Modify: `components/beta/AppShell.tsx`

**Interfaces:**
- Consumes: `NAV_ITEMS`, `ThemeToggleButton`, `NotificationsButton` (Task 1); `usePathname`, `useBetaApp`, `CollectiveWordmark`, `Badge`, `motion`, lucide icons, `Link`.
- Produces: `DesktopSidebar` component; a responsive `AppShell` shell.

- [ ] **Step 1: Add `DesktopSidebar` component** (in `components/beta/AppShell.tsx`, after `BottomNav`):

```tsx
function DesktopSidebar({ unread, showDemoBadge, demoLabel }: { unread: number; showDemoBadge: boolean; demoLabel: string | null }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[#EFE7D8] bg-[#FFFDF8] px-4 py-6 lg:flex">
      <Link href="/home" aria-label="Collective home" className="px-2"><CollectiveWordmark /></Link>
      <nav className="mt-8 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${active ? "text-[#F2A900]" : "text-[#8D877F] hover:text-[#111111]"}`}
            >
              {active && <motion.span layoutId="desktop-nav-pill" className="absolute inset-0 -z-10 rounded-2xl bg-[#FFF1C7]" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
              <Icon size={20} strokeWidth={active ? 2.6 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <Link
        href="/proof/new/conf-s1"
        className="mt-6 flex items-center justify-center gap-2 rounded-full bg-[#F2A900] px-4 py-3 text-sm font-extrabold text-white shadow-[0_10px_26px_rgba(242,169,0,0.35)] transition-shadow hover:shadow-[0_14px_32px_rgba(242,169,0,0.5)]"
      >
        <Plus size={18} strokeWidth={2.6} /> Submit proof
      </Link>
      <div className="mt-auto flex items-center gap-2 px-1 pt-6">
        <NotificationsButton unread={unread} />
        <ThemeToggleButton />
        {showDemoBadge && demoLabel && <Badge tone="muted">{demoLabel}</Badge>}
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Make `AppShell`'s root responsive.** Change the root `<main>` to a flex row that hosts the sidebar + a content column. Replace the current `return (<main className="mx-auto min-h-screen max-w-[430px] …">…</main>)` structure so that:
  - Root: `<div className="min-h-screen bg-[#FFF8EE] text-[#111111] lg:flex">`.
  - First child: `<DesktopSidebar unread={unread} showDemoBadge={showDemoBadge} demoLabel={showDemoBadge ? "Demo data" : isMockMode ? firebaseMode : null} />`.
  - Second child: the existing mobile-framed `<main>` but made responsive — `className="relative mx-auto min-h-screen w-full max-w-[430px] bg-[#FFF8EE] text-[#111111] shadow-[0_0_0_1px_rgba(239,231,216,0.8)] lg:max-w-none lg:flex-1 lg:shadow-none"`.
  - Inside that `<main>`: wrap the existing `<header>` with `lg:hidden` (mobile header hidden on desktop); keep the content `<div>` but make its desktop padding/width: change `className="px-5 pb-[calc(110px+env(safe-area-inset-bottom,0px))] pt-5"` → `className="px-5 pb-[calc(110px+env(safe-area-inset-bottom,0px))] pt-5 lg:mx-auto lg:max-w-4xl lg:px-8 lg:py-8"`; keep the loading/skeleton + motion wrapper inside unchanged.
  - `<BottomNav />` stays the last child of `<main>` but gets wrapped/classed `lg:hidden` (add `lg:hidden` to the `<nav>` root className in `BottomNav`).

Concretely, the returned JSX becomes:

```tsx
  return (
    <div className="min-h-screen bg-[#FFF8EE] text-[#111111] lg:flex">
      <DesktopSidebar unread={unread} showDemoBadge={showDemoBadge} demoLabel={showDemoBadge ? "Demo data" : isMockMode ? firebaseMode : null} />
      <main className="relative mx-auto min-h-screen w-full max-w-[430px] bg-[#FFF8EE] text-[#111111] shadow-[0_0_0_1px_rgba(239,231,216,0.8)] lg:max-w-none lg:flex-1 lg:shadow-none">
        <header className="sticky top-0 z-30 border-b border-[#EFE7D8]/70 bg-[#FFF8EE]/92 px-5 pb-3 pt-[calc(14px+env(safe-area-inset-top,0px))] backdrop-blur-xl lg:hidden">
          {/* …existing header inner markup unchanged, using <ThemeToggleButton /> + <NotificationsButton unread={unread} />… */}
        </header>
        <div className="px-5 pb-[calc(110px+env(safe-area-inset-bottom,0px))] pt-5 lg:mx-auto lg:max-w-4xl lg:px-8 lg:py-8">
          {/* …existing loading ? skeleton : motion children… unchanged… */}
        </div>
        <BottomNav />
      </main>
    </div>
  );
```

- [ ] **Step 3: Add `lg:hidden` to `BottomNav`'s root `<nav>`** className (append ` lg:hidden` to the existing class string) so the bottom bar + FAB disappear on desktop.

- [ ] **Step 4: Verify**

Run: `npm run typecheck` — Expected: clean.
Run: `npm run build 2>&1 | tail -20` — Expected: compiles.

- [ ] **Step 5: Commit**

```bash
git add components/beta/AppShell.tsx
git commit -m "feat(shell): responsive desktop sidebar + centered content (mobile unchanged)"
```

---

## Self-Review

**Spec coverage:** responsive switch at lg → T2; sidebar (logo/nav/proof/bottom controls) → T2; content centered max-w-4xl on desktop → T2 step 2; mobile pixel-identical (header+BottomNav wrapped lg:hidden, 430px cap kept below lg) → T2; shared NAV_ITEMS + controls (no drift) → T1; auth/redirect/loading preserved → untouched in both tasks. Covered.

**Placeholder scan:** Task 2's header/content inner markup is described as "unchanged" with the exact wrapper classes given — the implementer keeps the existing inner JSX (already in the file from Task 1), only adding the listed wrapper classes. No TODO/stubs.

**Type consistency:** `NAV_ITEMS` shape (`href/label/icon`) used identically in BottomNav (T1) + DesktopSidebar (T2); `ThemeToggleButton`/`NotificationsButton` props match call sites; `DesktopSidebar` props (`unread`,`showDemoBadge`,`demoLabel`) match the call in AppShell.
