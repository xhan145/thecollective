"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Home, MessageSquare, Plus, User } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { CollectiveWordmark } from "./Brand";
import { Badge } from "./ui";
import { ScreenSkeleton } from "./motion";
import { useBetaApp } from "./AppStateProvider";
import { demoSeedEnabled } from "@/lib/betaData";

const protectedPrefixes = ["/home", "/directions", "/practice", "/proof", "/feed", "/profile", "/app-feedback", "/beta-feedback-review"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isMockMode, firebaseMode, supabaseEnabled, authReady } = useBetaApp();
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const loading = supabaseEnabled && !authReady && isProtected;
  // Show the demo-data badge whenever seed data is what's on screen
  // (no real account loaded). Disappears for real Supabase accounts.
  const showDemoBadge = demoSeedEnabled && (!currentUser || currentUser.id.startsWith("user-"));

  useEffect(() => {
    // Wait until the Supabase session has been checked before redirecting,
    // otherwise a hard refresh on an authed route bounces to /auth.
    if (authReady && !currentUser && isProtected) {
      router.replace("/auth");
    }
  }, [authReady, currentUser, isProtected, router]);

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-[#FFF8EE] text-[#111111] shadow-[0_0_0_1px_rgba(239,231,216,0.8)]">
      <header className="sticky top-0 z-30 border-b border-[#EFE7D8]/70 bg-[#FFF8EE]/92 px-5 pb-3 pt-[calc(14px+env(safe-area-inset-top,0px))] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <Link href="/home" aria-label="Collective home">
            <CollectiveWordmark />
          </Link>
          {showDemoBadge ? <Badge tone="muted">Demo data</Badge> : isMockMode ? <Badge tone="muted">{firebaseMode}</Badge> : null}
        </div>
      </header>
      <div className="px-5 pb-[calc(110px+env(safe-area-inset-bottom,0px))] pt-5">
        {loading ? (
          <ScreenSkeleton />
        ) : (
          <motion.div key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {children}
          </motion.div>
        )}
      </div>
      <BottomNav />
    </main>
  );
}

function BottomNav() {
  const pathname = usePathname();
  const items = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/practice", label: "Practice", icon: BookOpen },
    { href: "/feed", label: "Feed", icon: MessageSquare },
    { href: "/profile", label: "Profile", icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 bg-gradient-to-t from-[#FFF8EE] via-[#FFF8EE] to-[#FFF8EE]/70 px-5 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-4">
      <motion.div whileTap={{ scale: 0.92 }} className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-4">
        <Link
          href="/proof/new/say-clear-thing"
          className="grid h-[58px] w-[58px] place-items-center rounded-full bg-[#F2A900] text-white shadow-[0_16px_34px_rgba(242,169,0,0.34)] transition hover:shadow-[0_20px_40px_rgba(242,169,0,0.44)]"
          aria-label="Submit proof"
        >
          <Plus size={27} strokeWidth={2.6} />
        </Link>
      </motion.div>
      <div className="grid grid-cols-4 rounded-[28px] border border-[#EFE7D8] bg-[#FFFDF8]/95 p-2 shadow-[0_16px_44px_rgba(71,52,18,0.10)] backdrop-blur">
        {items.map((item, index) => {
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
