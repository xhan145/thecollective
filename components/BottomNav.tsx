import Link from "next/link";
import { Bookmark, Radio, ShieldCheck, UploadCloud, UserRound, Zap } from "lucide-react";
import type { ShellTab } from "@/components/AppShell";

const TABS = [
  { key: "discover", label: "Flow", href: "/discover", Icon: Radio },
  { key: "saved", label: "Saved", href: "/saved", Icon: Bookmark },
  { key: "upload", label: "Upload", href: "/artist/upload", Icon: UploadCloud, raised: true },
  { key: "backed", label: "Backed", href: "/backed", Icon: Zap },
  { key: "profile", label: "Scout", href: "/scout/profile", Icon: UserRound },
] as const;

export function BottomNav({ active }: { active: ShellTab | string }) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 z-30 w-full max-w-[520px] -translate-x-1/2 border-t border-line bg-night/92 backdrop-blur-xl"
      style={{ paddingBottom: "var(--safe-bottom)" }}
      aria-label="Primary"
    >
      <div className="flex items-end justify-around px-2 py-2">
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          const Icon = tab.Icon;
          if ("raised" in tab && tab.raised) {
            return (
              <Link
                key={tab.key}
                href={tab.href}
                aria-label={tab.label}
                className="-mt-6 grid h-14 w-14 place-items-center rounded-full bg-signal text-night shadow-warmLg transition active:scale-95"
                title={tab.label}
              >
                <Icon size={24} strokeWidth={2.6} />
              </Link>
            );
          }
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`flex w-16 flex-col items-center gap-1 py-1 text-[11px] font-semibold transition ${
                isActive ? "text-signal" : "text-muted"
              }`}
              title={tab.label}
            >
              <Icon size={19} strokeWidth={isActive ? 2.6 : 2} />
              {tab.label}
            </Link>
          );
        })}
        {active === "admin" ? (
          <Link
            href="/admin"
            className="sr-only"
            aria-label="Admin"
            title="Admin"
          >
            <ShieldCheck size={18} />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
