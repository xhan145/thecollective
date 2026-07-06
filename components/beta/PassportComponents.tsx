"use client";

import Link from "next/link";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Camera, Compass, MessageSquare, ShieldCheck, Sparkles, User } from "lucide-react";
import { Avatar } from "./Avatar";
import { Card, TrustPill } from "./ui";
import type { ProfileDetails } from "@/lib/supabase/passportRepository";

export type PassportTab = "overview" | "proof" | "feedback" | "contribution";

// ── Header ───────────────────────────────────────────────────────────────
export function ProfileHeader({
  displayName,
  initials,
  avatarUrl,
  headline,
  directionTitle,
  trustLabel,
  openToIntroductions,
  onMenu,
}: {
  displayName: string;
  initials?: string;
  avatarUrl?: string;
  headline?: string | null;
  directionTitle?: string | null;
  trustLabel: string;
  openToIntroductions?: boolean;
  onMenu: () => void;
}) {
  return (
    <Card className="pixel-card pixel-corner p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <span className="inline-grid rounded-full p-[3px] ring-2 ring-[#F2A900]/45">
            <Avatar name={displayName} avatarUrl={avatarUrl} size={60} />
          </span>
          <div>
            <h2 className="text-xl font-extrabold leading-tight text-[#111111]">{displayName}</h2>
            {headline && <p className="mt-1 max-w-[34ch] text-sm leading-snug text-[#6E6E6E]">{headline}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={onMenu}
          aria-label="Passport menu"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#6E6E6E] transition-colors hover:bg-[#FFF1C7]/60 hover:text-[#111111] focus-visible:ring-2 focus-visible:ring-[#F2A900]/40"
        >
          <span className="flex items-center gap-[3px]" aria-hidden>
            <span className="h-[3px] w-[3px] rounded-full bg-current" />
            <span className="h-[3px] w-[3px] rounded-full bg-current" />
            <span className="h-[3px] w-[3px] rounded-full bg-current" />
          </span>
        </button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {directionTitle && (
          <span className="rounded-full bg-[#FFF1C7] px-3 py-1 text-xs font-extrabold text-[#7A5300]">{directionTitle}</span>
        )}
        <TrustPill label={trustLabel} />
        {openToIntroductions && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF3] px-3 py-1 text-xs font-bold text-[#15803D]">
            <span className="h-2 w-2 rounded-full bg-[#22C55E]" aria-hidden /> Open to introductions
          </span>
        )}
      </div>
    </Card>
  );
}

// ── Introduction (guided, not a vanity bio) ──────────────────────────────
const INTRO_ROWS: { key: keyof ProfileDetails; label: string; icon: typeof BookOpen }[] = [
  { key: "hereToPractice", label: "I'm here to practice", icon: BookOpen },
  { key: "currentlyWorkingOn", label: "I'm working on", icon: Compass },
  { key: "wantsFeedbackOn", label: "I'd like feedback on", icon: MessageSquare },
  { key: "canHelpWith", label: "I can help with", icon: Sparkles },
];

export function IntroductionCard({ details, editHref }: { details: ProfileDetails | null; editHref?: string }) {
  const filled = details && INTRO_ROWS.some((r) => (details[r.key] as string | null)?.trim());
  return (
    <Card className="pixel-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#B6AE9F]">Introduction</h3>
        {editHref ? (
          <Link href={editHref} className="rounded-full px-2.5 py-1 text-xs font-extrabold text-[#7A5300] hover:bg-[#FFF1C7]/60">
            Edit
          </Link>
        ) : null}
      </div>
      {!filled ? (
        <p className="mt-3 text-sm leading-6 text-[#6E6E6E]">
          Add a short, guided introduction so others know what you’re practicing and how you can help. It’s four small
          prompts — no blank bio to stare at.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {INTRO_ROWS.map((r) => {
            const value = (details?.[r.key] as string | null)?.trim();
            if (!value) return null;
            const Icon = r.icon;
            return (
              <div key={r.key} className="flex gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#FFF1C7] text-[#C8861A] pixel-icon-tile">
                  <Icon size={15} />
                </span>
                <div>
                  <p className="text-xs font-bold text-[#9B958B]">{r.label}</p>
                  <p className="text-sm leading-snug text-[#38322A]">{value}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ── Tabs ─────────────────────────────────────────────────────────────────
const TABS: { key: PassportTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "proof", label: "Proof" },
  { key: "feedback", label: "Feedback" },
  { key: "contribution", label: "Contribution" },
];

export function PassportTabs({ active, onChange }: { active: PassportTab; onChange: (t: PassportTab) => void }) {
  return (
    <div className="flex gap-1 rounded-full bg-[#FFFDF8] p-1">
      {TABS.map((t) => {
        const on = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            aria-current={on ? "page" : undefined}
            className={`relative flex-1 rounded-full px-3 py-2 text-xs font-extrabold transition-colors ${on ? "text-[#7A5300]" : "text-[#8D877F] hover:text-[#111111]"}`}
          >
            {on && (
              <motion.span layoutId="passport-tab-pill" className="absolute inset-0 -z-10 rounded-full bg-[#FFF1C7]" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
            )}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Overview cards ───────────────────────────────────────────────────────
export function CurrentDirectionCard({ directionTitle, focusSkill, nextStep }: { directionTitle?: string | null; focusSkill?: string | null; nextStep?: string | null }) {
  return (
    <Card className="pixel-card p-5">
      <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#B6AE9F]">Current direction</h3>
      <p className="mt-2 text-lg font-extrabold text-[#111111]">{directionTitle || "Choose a direction"}</p>
      {focusSkill && <p className="mt-1 text-sm text-[#6E6E6E]">Focus: {focusSkill}</p>}
      {nextStep && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-[#FFF8EE] px-3 py-2 text-sm font-bold text-[#7A5300]">
          <Compass size={16} /> Next: {nextStep}
        </div>
      )}
    </Card>
  );
}

export function ProgressSnapshotCard({ practices, proofs, feedbackLoops, usefulResponses }: { practices: number; proofs: number; feedbackLoops: number; usefulResponses: number }) {
  const stats = [
    { label: "Practices", value: practices },
    { label: "Proofs", value: proofs },
    { label: "Feedback loops", value: feedbackLoops },
    { label: "Useful responses", value: usefulResponses },
  ];
  return (
    <Card className="pixel-card p-5">
      <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#B6AE9F]">Progress snapshot</h3>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-[#FFF8EE] p-3 pixel-icon-tile">
            <p className="text-2xl font-extrabold text-[#111111]">{s.value}</p>
            <p className="text-xs font-bold text-[#6E6E6E]">{s.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function PinnedProofCard({ title, kind, age }: { title: string; kind: string; age?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#FFF8EE] p-3 pixel-icon-tile">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#FFF1C7] text-[#C8861A]">
        <Camera size={16} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold text-[#111111]">{title}</p>
        <p className="text-xs text-[#6E6E6E]">{[kind, age].filter(Boolean).join(" · ")}</p>
      </div>
    </div>
  );
}

// ── Badge medallion row ──────────────────────────────────────────────────
export function BadgeMedallionRow({ names, viewHref }: { names: string[]; viewHref: string }) {
  return (
    <Card className="pixel-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#B6AE9F]">Badges</h3>
        <Link href={viewHref} className="text-xs font-extrabold text-[#7A5300] hover:underline">
          Manage
        </Link>
      </div>
      {names.length === 0 ? (
        <p className="mt-3 text-sm text-[#6E6E6E]">Earn badges by practicing, proving, and giving useful feedback.</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {names.map((n) => (
            <span key={n} className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1C7] px-3 py-1.5 text-xs font-extrabold text-[#7A5300] pixel-corner">
              <Sparkles size={13} /> {n}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── 3-dot menu (bottom sheet) ────────────────────────────────────────────
const MENU_ITEMS: { label: string; href: string; icon: typeof BookOpen }[] = [
  { label: "Edit profile", href: "/passport/edit", icon: User },
  { label: "Edit introduction", href: "/passport/edit-introduction", icon: BookOpen },
  { label: "Manage displayed badges", href: "/badges", icon: Sparkles },
  { label: "Manage pinned proofs", href: "/passport/pinned-proofs", icon: Camera },
  { label: "Introduction settings", href: "/passport/edit-introduction", icon: Compass },
  { label: "Visibility & privacy", href: "/settings", icon: ShieldCheck },
  { label: "Feedback preferences", href: "/settings", icon: MessageSquare },
  { label: "Settings", href: "/settings", icon: Compass },
];

export function PassportMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Passport menu">
      <button type="button" aria-label="Close menu" onClick={onClose} className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 360, damping: 32 }}
        className="relative z-10 w-full max-w-[430px] rounded-t-3xl bg-[#FFFDF8] p-3 pb-[calc(16px+env(safe-area-inset-bottom,0px))] shadow-[0_-12px_44px_rgba(71,52,18,0.18)] sm:rounded-3xl"
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[#EFE7D8] sm:hidden" />
        {MENU_ITEMS.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.href + m.label}
              href={m.href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-[#38322A] transition-colors hover:bg-[#FFF1C7]/60"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#FFF1C7] text-[#C8861A] pixel-icon-tile">
                <Icon size={16} />
              </span>
              {m.label}
              <span className="ml-auto text-[#C9C2B5]" aria-hidden>›</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onClose}
          className="mt-1 w-full rounded-2xl px-3 py-3 text-sm font-extrabold text-[#6E6E6E] hover:bg-[#FFF8EE]"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}
