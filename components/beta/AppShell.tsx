"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Compass, Home, Plus, User } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { CollectiveWordmark } from "./Brand";
import { Badge } from "./ui";
import { useBetaApp } from "./AppStateProvider";

const protectedPrefixes = ["/home", "/directions", "/practice", "/proof", "/feed", "/profile", "/passport", "/settings", "/app-feedback", "/beta-feedback-review"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isMockMode, firebaseMode } = useBetaApp();

  useEffect(() => {
    if (!currentUser && protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
      router.replace("/auth");
    }
  }, [currentUser, pathname, router]);

  return (
    <main className="retro-pixel-shell mx-auto min-h-screen max-w-[430px] text-[#111111] shadow-[0_0_0_1px_rgba(239,231,216,0.8)]">
      <header className="sticky top-0 z-30 border-b border-[#EFE7D8]/70 bg-[#FFF8EE]/92 px-5 pb-3 pt-[calc(14px+env(safe-area-inset-top,0px))] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <Link href="/home" aria-label="Collective home">
            <CollectiveWordmark />
          </Link>
          {isMockMode && <Badge tone="muted">{firebaseMode}</Badge>}
        </div>
      </header>
      <div className="px-5 pb-[calc(110px+env(safe-area-inset-bottom,0px))] pt-5">{children}</div>
      <BottomNav />
    </main>
  );
}

function BottomNav() {
  const pathname = usePathname();
  const items = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/directions", label: "Discover", icon: Compass },
    { href: "/practice", label: "Practice", icon: BookOpen },
    { href: "/passport", label: "Passport", icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 bg-gradient-to-t from-[#FFF8EE] via-[#FFF8EE] to-[#FFF8EE]/70 px-5 pb-[calc(12px+env(safe-area-inset-bottom,0px))] pt-4">
      <Link
        href="/proof/new/say-clear-thing"
        className="pixel-button absolute left-1/2 top-0 grid h-[58px] w-[58px] -translate-x-1/2 -translate-y-4 place-items-center rounded-full bg-[#F2A900] text-white transition"
        aria-label="Submit proof"
      >
        <Plus size={27} strokeWidth={2.6} />
      </Link>
      <div className="pixel-card grid grid-cols-4 rounded-[28px] border border-[#EFE7D8] bg-[#FFFDF8]/95 p-2 backdrop-blur">
        {items.map((item, index) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              className={`flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-[22px] text-[11px] font-bold transition ${index === 1 ? "mr-6" : index === 2 ? "ml-6" : ""} ${active ? "text-[#F2A900]" : "text-[#8D877F]"}`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
