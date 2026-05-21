"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Compass, Home, MessageCircle, Plus } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ children, title, subtitle }: { children: ReactNode; title?: string; subtitle?: string }) {
  return (
    <main className="mobile-shell">
      <header className="app-header">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Collective home">
            <div className="brand-mark">C</div>
            <div>
              <p className="text-sm font-black leading-none tracking-tight">Collective</p>
              <p className="mt-1 text-[11px] text-[#8f887e]">practice · proof · feedback</p>
            </div>
          </Link>
          <Link href="/setup" className="pill pill-muted">Setup</Link>
        </div>
        {title && (
          <div className="mt-5">
            <p className="section-eyebrow">Collective</p>
            <h1 className="text-[28px] font-black leading-tight tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-sm leading-6 text-[#c8c2b8]">{subtitle}</p>}
          </div>
        )}
      </header>
      <div className="screen-content">{children}</div>
      <BottomNav />
    </main>
  );
}

function BottomNav() {
  const pathname = usePathname();
  const items = [
    ["/", Home, "Home"],
    ["/paths", Compass, "Practice"],
    ["/proof/new", Plus, "Submit"],
    ["/contribute", MessageCircle, "Feedback"],
    ["/dashboard", BarChart3, "Progress"]
  ] as const;

  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 px-4 pb-[calc(12px+var(--safe-bottom))]">
      <div className="grid grid-cols-5 rounded-[28px] border border-white/10 bg-[#171b24]/90 p-1.5 shadow-float backdrop-blur-2xl">
        {items.map(([href, Icon, label]) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-[22px] px-1 text-[10px] font-bold transition ${active ? "bg-white/[0.08] text-[#f6f3ec]" : "text-[#8f887e] active:bg-white/[0.05]"}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={active ? 2.6 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
