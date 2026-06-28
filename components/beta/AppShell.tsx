"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BookOpen, Home, MessageSquare, Moon, Plus, Sun, User } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { CollectiveWordmark } from "./Brand";
import { Badge } from "./ui";
import { ScreenSkeleton } from "./motion";
import { useBetaApp } from "./AppStateProvider";
import { useTheme } from "./ThemeProvider";
import { demoSeedEnabled } from "@/lib/betaData";
import { REQUIRE_INVITE } from "@/lib/beta/redeemInvite";

const protectedPrefixes = ["/home", "/directions", "/practice", "/proof", "/feed", "/profile", "/app-feedback", "/beta-feedback-review", "/notes", "/notifications", "/settings", "/account", "/contribute", "/cohorts", "/badges"];

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

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isMockMode, firebaseMode, supabaseEnabled, authReady, unreadNotificationCount } = useBetaApp();
  const unread = unreadNotificationCount();
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const loading = supabaseEnabled && !authReady && isProtected;
  // Show the demo-data badge whenever seed data is what's on screen
  // (no real account loaded). Disappears for real Supabase accounts.
  const showDemoBadge = demoSeedEnabled && (!currentUser || currentUser.id.startsWith("user-"));

  useEffect(() => {
    if (!authReady) return;
    // Wait until the Supabase session has been checked before redirecting,
    // otherwise a hard refresh on an authed route bounces to /auth.
    if (!currentUser && isProtected) {
      router.replace("/auth");
      return;
    }
    // Invite gate: a real (non-demo) Supabase member without beta access is sent
    // to the access screen. Demo explorers (ids start with "user-") are exempt.
    if (
      REQUIRE_INVITE &&
      supabaseEnabled &&
      currentUser &&
      !currentUser.id.startsWith("user-") &&
      !currentUser.betaAccess &&
      isProtected
    ) {
      router.replace("/access");
      return;
    }
    // Real (Supabase) users who haven't onboarded go to onboarding first.
    if (
      supabaseEnabled &&
      currentUser &&
      currentUser.onboardingCompleted === false &&
      isProtected &&
      !pathname.startsWith("/onboarding")
    ) {
      router.replace("/onboarding");
    }
  }, [authReady, currentUser, isProtected, supabaseEnabled, pathname, router]);

  return (
    <div className="min-h-screen bg-[#FFF8EE] text-[#111111] lg:flex">
      <DesktopSidebar unread={unread} showDemoBadge={showDemoBadge} demoLabel={showDemoBadge ? "Demo data" : isMockMode ? firebaseMode : null} />
      <main className="relative mx-auto min-h-screen w-full max-w-[430px] bg-[#FFF8EE] text-[#111111] shadow-[0_0_0_1px_rgba(239,231,216,0.8)] lg:max-w-none lg:flex-1 lg:shadow-none">
        <header className="sticky top-0 z-30 border-b border-[#EFE7D8]/70 bg-[#FFF8EE]/92 px-5 pb-3 pt-[calc(14px+env(safe-area-inset-top,0px))] backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link href="/home" aria-label="Collective home">
              <CollectiveWordmark />
            </Link>
            <div className="flex items-center gap-2">
              {showDemoBadge ? <Badge tone="muted">Demo data</Badge> : isMockMode ? <Badge tone="muted">{firebaseMode}</Badge> : null}
              <ThemeToggleButton />
              <NotificationsButton unread={unread} />
            </div>
          </div>
        </header>
        <div className="px-5 pb-[calc(110px+env(safe-area-inset-bottom,0px))] pt-5 lg:mx-auto lg:max-w-4xl lg:px-8 lg:py-8">
          {loading ? (
            <div className="space-y-4">
              <p className="text-center text-sm font-extrabold text-[#6E6E6E]">Getting your space ready…</p>
              <ScreenSkeleton />
            </div>
          ) : (
            <motion.div key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              {children}
            </motion.div>
          )}
        </div>
        <BottomNav />
      </main>
    </div>
  );
}

function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 bg-[linear-gradient(to_top,var(--c-bg)_62%,transparent)] px-5 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-4 lg:hidden">
      {/* Wrapper owns centering (static translate, never touched by Motion);
          the inner motion element owns the tap-scale so it can't wipe the
          centering/raise transform. z-[60] keeps the FAB above the nav pill. */}
      <div className="pointer-events-none absolute left-1/2 top-0 z-[60] -translate-x-1/2 -translate-y-4">
        {/* Warm gold bloom so the bar reads as growing out of the button (replaces the old white glow). */}
        <span aria-hidden className="absolute left-1/2 top-1/2 -z-10 h-28 w-44 -translate-x-1/2 rounded-full bg-[radial-gradient(60%_60%_at_50%_40%,rgba(242,169,0,0.30),transparent_72%)] blur-md" />
        <motion.div whileTap={{ scale: 0.92 }} className="pointer-events-auto">
          <Link
            href="/proof/new/conf-s1"
            className="grid h-[58px] w-[58px] place-items-center rounded-full bg-[#F2A900] text-white shadow-[0_10px_26px_rgba(242,169,0,0.45)] outline-none transition-shadow hover:shadow-[0_14px_32px_rgba(242,169,0,0.55)] focus-visible:ring-4 focus-visible:ring-[#F2A900]/40"
            aria-label="Submit proof"
          >
            <Plus size={27} strokeWidth={2.6} />
          </Link>
        </motion.div>
      </div>
      <div className="grid grid-cols-4 rounded-[28px] border border-[#EFE7D8] bg-[#FFFDF8]/95 p-2 shadow-[0_16px_44px_rgba(71,52,18,0.10)] backdrop-blur">
        {NAV_ITEMS.map((item, index) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              className={`relative flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-[22px] text-[11px] font-bold transition-colors ${index === 1 ? "mr-6" : index === 2 ? "ml-6" : ""} ${active ? "text-[#F2A900]" : "text-[#8D877F]"}`}
            >
              {active && (
                <motion.span
                  layoutId="nav-active-pill"
                  className="absolute inset-x-1 inset-y-0 rounded-[20px] bg-[#FFF1C7]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <motion.span
                className="relative z-10 flex flex-col items-center gap-1"
                animate={{ scale: active ? 1.06 : 1, y: active ? -1 : 0 }}
                transition={{ type: "spring", stiffness: 360, damping: 22 }}
              >
                <Icon size={20} strokeWidth={active ? 2.6 : 2} />
                <span>{item.label}</span>
              </motion.span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function DesktopSidebar({ unread, showDemoBadge, demoLabel }: { unread: number; showDemoBadge: boolean; demoLabel: string | null }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[#EFE7D8] bg-[#FFFDF8] px-4 py-6 lg:flex">
      <Link href="/home" aria-label="Collective home" className="px-2">
        <CollectiveWordmark />
      </Link>
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
              {active && (
                <motion.span
                  layoutId="desktop-nav-pill"
                  className="absolute inset-0 -z-10 rounded-2xl bg-[#FFF1C7]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
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
