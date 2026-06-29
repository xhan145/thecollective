"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  BookOpen,
  FileText,
  HelpCircle,
  Image,
  MessageCircle,
  ListChecks,
  Monitor,
  ShieldCheck,
  Bookmark,
  UserRound
} from "lucide-react";
import { CollectiveMiniMark } from "@/components/beta/Brand";
import { Badge, Button, ButtonLink, Card, TextArea, TextInput } from "@/components/beta/ui";
import type { PassportBadge, PassportPinnedProof, PassportProfile, PassportTab } from "@/lib/passportData";

export function PassportHeader({
  profile,
  onMenu
}: {
  profile: PassportProfile;
  onMenu: () => void;
}) {
  return (
    <Card className="pixel-card-strong overflow-hidden p-0">
      <div className="pixel-grid-soft px-5 pb-5 pt-4">
        <div className="mb-5 flex items-center justify-between">
          <Link href="/home" className="grid h-11 w-11 place-items-center rounded-full border border-[#EFE7D8] bg-[#FFFDF8]" aria-label="Back to home">
            <ArrowRight size={19} className="rotate-180" />
          </Link>
          <button
            type="button"
            onClick={onMenu}
            className="grid h-11 w-11 place-items-center rounded-full border border-[#EFE7D8] bg-[#FFFDF8] text-[#111111] active:scale-95"
            aria-label="Open Passport menu"
          >
            <ListChecks size={22} />
          </button>
        </div>
        <div className="flex items-start gap-4">
          <div className="grid h-[78px] w-[78px] shrink-0 place-items-center rounded-[26px] border-4 border-[#FFF1C7] bg-[#F2A900] text-3xl font-black text-white shadow-[4px_4px_0_#D6BD86]">
            E
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[27px] font-black leading-tight text-[#111111]">{profile.displayName}</h1>
            <p className="mt-1 text-sm leading-6 text-[#6E6E6E]">{profile.headline}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{profile.currentDirection}</Badge>
              <Badge tone="muted">Level {profile.trustLevel} - {profile.trustLabel}</Badge>
            </div>
            {profile.openToIntroductions && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#D6F5DF] bg-[#E8F8EE] px-3 py-1 text-[12px] font-extrabold text-[#17743B]">
                <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                Open to introductions
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function PassportMenuSheet({ onClose }: { onClose: () => void }) {
  const items = [
    ["Edit profile", "/passport/edit"],
    ["Edit introduction", "/passport/edit-introduction"],
    ["Manage displayed badges", "/passport/badges"],
    ["Manage pinned proofs", "/passport/pinned-proofs"],
    ["Introduction settings", "/settings/introduction-preferences"],
    ["Visibility & privacy", "/settings/profile-visibility"],
    ["Feedback preferences", "/settings/feedback-preferences"],
    ["Share profile", "/passport/share"],
    ["Settings", "/settings"]
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#111111]/30 px-4 pb-4" role="dialog" aria-modal="true">
      <div className="pixel-card-strong w-full max-w-[390px] rounded-[28px] border border-[#EFE7D8] bg-[#FFFDF8] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CollectiveMiniMark className="h-7 w-11" />
            <p className="text-sm font-black text-[#111111]">Passport actions</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-2 text-sm font-black text-[#6E6E6E]">
            Close
          </button>
        </div>
        <div className="space-y-2">
          {items.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-12 items-center justify-between rounded-[18px] border border-[#EFE7D8] bg-[#FFF8EE] px-4 text-sm font-extrabold text-[#111111] active:scale-[0.99]"
              onClick={onClose}
            >
              {label}
              <ArrowRight size={17} className="text-[#F2A900]" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function IntroductionCard({ profile }: { profile: PassportProfile }) {
  const rows = [
    { label: "I'm here to practice", value: profile.intro.hereToPractice, icon: BookOpen },
    { label: "I'm working on", value: profile.intro.currentlyWorkingOn, icon: Bookmark },
    { label: "I'd like feedback on", value: profile.intro.wantsFeedbackOn, icon: MessageCircle },
    { label: "I can help with", value: profile.intro.canHelpWith, icon: MessageCircle }
  ];
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-black text-[#111111]">Introduction</h2>
        <ButtonLink href="/passport/edit-introduction" variant="secondary" className="min-h-10 px-4 text-xs">Edit</ButtonLink>
      </div>
      <div className="mt-4 space-y-3">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="flex gap-3 rounded-[18px] bg-[#FFF8EE] p-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#FFF1C7] text-[#F2A900]">
                <Icon size={18} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.11em] text-[#6E6E6E]">{row.label}</p>
                <p className="mt-1 text-sm font-bold leading-6 text-[#111111]">{row.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function BadgeRow({ badges }: { badges: PassportBadge[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {badges.map((badge) => (
        <div
          key={badge.name}
          className={`pixel-card rounded-[18px] border p-3 text-center ${badge.earned ? "border-[#EFE7D8] bg-[#FFFDF8]" : "border-[#EFE7D8] bg-[#FFF8EE] opacity-70"}`}
        >
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-[14px] bg-[#FFF1C7] text-sm font-black text-[#F2A900]">{badge.icon}</div>
          <p className="mt-2 text-[12px] font-black leading-4 text-[#111111]">{badge.name}</p>
          <p className="mt-1 text-[10px] font-bold text-[#6E6E6E]">{badge.earned ? "Earned" : "In progress"}</p>
        </div>
      ))}
    </div>
  );
}

export function PassportTabs({ activeTab, onChange }: { activeTab: PassportTab; onChange: (tab: PassportTab) => void }) {
  const tabs: PassportTab[] = ["overview", "proof", "feedback", "contribution"];
  return (
    <div className="grid grid-cols-4 rounded-[20px] border border-[#EFE7D8] bg-[#FFFDF8] p-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={`min-h-10 rounded-[16px] text-[12px] font-black capitalize ${activeTab === tab ? "bg-[#F2A900] text-white shadow-[2px_2px_0_#C78300]" : "text-[#6E6E6E]"}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

export function CurrentDirectionCard({ profile }: { profile: PassportProfile }) {
  return (
    <Card className="p-5">
      <Badge>Current direction</Badge>
      <h3 className="mt-3 text-xl font-black text-[#111111]">{profile.currentDirection}</h3>
      <p className="mt-1 text-sm font-bold text-[#6E6E6E]">{profile.currentFocusSkill}</p>
      <div className="mt-4 rounded-[18px] bg-[#FFF8EE] p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#F2A900]">Next practice</p>
        <p className="mt-2 text-sm font-extrabold text-[#111111]">Record a 60-second intro.</p>
      </div>
    </Card>
  );
}

export function ProgressSnapshotCard({ profile }: { profile: PassportProfile }) {
  const stats = [
    ["Practices", profile.stats.practices],
    ["Proofs", profile.stats.proofs],
    ["Feedback loops", profile.stats.feedbackLoops],
    ["Useful feedback", profile.stats.usefulFeedbackResponses]
  ];
  return (
    <Card className="p-5">
      <h3 className="text-xl font-black text-[#111111]">Progress snapshot</h3>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-[18px] border border-[#EFE7D8] bg-[#FFF8EE] p-4">
            <p className="text-2xl font-black text-[#111111]">{value}</p>
            <p className="mt-1 text-[12px] font-bold text-[#6E6E6E]">{label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function TrustSummaryCard({ profile }: { profile: PassportProfile }) {
  return (
    <Card className="p-5">
      <Badge tone="green">Trust</Badge>
      <h3 className="mt-3 text-xl font-black text-[#111111]">Level {profile.trustLevel} - {profile.trustLabel}</h3>
      <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">Earned through useful feedback, proof, and beginner-safe behavior.</p>
    </Card>
  );
}

export function PinnedProofCard({ proof }: { proof: PassportPinnedProof }) {
  return (
    <div className="flex gap-3 rounded-[18px] border border-[#EFE7D8] bg-[#FFF8EE] p-3">
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[16px] bg-[#FFF1C7] text-[#F2A900]">
        {proof.type === "Video" ? <Image size={20} /> : proof.type === "Audio" ? <Bell size={20} /> : <FileText size={20} />}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-[#111111]">{proof.title}</p>
        <p className="mt-1 text-[12px] font-bold text-[#6E6E6E]">{proof.type} - {proof.age}{proof.duration ? ` - ${proof.duration}` : ""}</p>
      </div>
    </div>
  );
}

export function SettingsSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section>
      <p className="mb-2 px-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#6E6E6E]">{label}</p>
      <Card className="overflow-hidden p-0">{children}</Card>
    </section>
  );
}

export function SettingsRow({
  title,
  subtitle,
  href,
  icon,
  danger = false
}: {
  title: string;
  subtitle: string;
  href: string;
  icon?: ReactNode;
  danger?: boolean;
}) {
  return (
    <Link href={href} className="flex min-h-[74px] items-center gap-3 border-b border-[#EFE7D8] px-4 py-3 last:border-b-0 active:bg-[#FFF8EE]">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-[15px] ${danger ? "bg-[#FDECEC] text-[#DC2626]" : "bg-[#FFF1C7] text-[#F2A900]"}`}>
        {icon || <ShieldCheck size={18} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-black ${danger ? "text-[#DC2626]" : "text-[#111111]"}`}>{title}</p>
        <p className="mt-1 text-[12px] font-medium leading-5 text-[#6E6E6E]">{subtitle}</p>
      </div>
      <ArrowRight size={18} className="text-[#B5A895]" />
    </Link>
  );
}

export function ToggleRow({ title, subtitle, defaultChecked = true }: { title: string; subtitle?: string; defaultChecked?: boolean }) {
  return (
    <label className="flex min-h-[68px] items-center justify-between gap-3 border-b border-[#EFE7D8] px-4 py-3 last:border-b-0">
      <span>
        <span className="block text-sm font-black text-[#111111]">{title}</span>
        {subtitle && <span className="mt-1 block text-[12px] leading-5 text-[#6E6E6E]">{subtitle}</span>}
      </span>
      <input type="checkbox" defaultChecked={defaultChecked} className="h-6 w-6 accent-[#F2A900]" />
    </label>
  );
}

export function RadioOptionCard({ title, body, name, defaultChecked = false }: { title: string; body: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex gap-3 rounded-[18px] border border-[#EFE7D8] bg-[#FFFDF8] p-4">
      <input type="radio" name={name} defaultChecked={defaultChecked} className="mt-1 h-5 w-5 accent-[#F2A900]" />
      <span>
        <span className="block text-sm font-black text-[#111111]">{title}</span>
        <span className="mt-1 block text-[12px] leading-5 text-[#6E6E6E]">{body}</span>
      </span>
    </label>
  );
}

export function FormFieldCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-[20px] border border-[#EFE7D8] bg-[#FFFDF8] p-4">
      <label className="text-[12px] font-black uppercase tracking-[0.12em] text-[#6E6E6E]">{label}</label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function PreferenceChip({ children }: { children: ReactNode }) {
  return (
    <label className="inline-flex min-h-11 items-center rounded-full border border-[#EFE7D8] bg-[#FFFDF8] px-4 text-sm font-extrabold text-[#111111] has-[:checked]:border-[#F2A900] has-[:checked]:bg-[#FFF1C7]">
      <input type="checkbox" className="sr-only" defaultChecked />
      {children}
    </label>
  );
}

export function SettingsPageShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/settings" className="grid h-11 w-11 place-items-center rounded-full border border-[#EFE7D8] bg-[#FFFDF8]" aria-label="Back to settings">
          <ArrowRight size={19} className="rotate-180" />
        </Link>
        <div className="text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#6E6E6E]">Settings</p>
          <h1 className="text-xl font-black text-[#111111]">{title}</h1>
        </div>
        <CollectiveMiniMark className="h-8 w-12" />
      </div>
      {subtitle && <p className="text-center text-sm leading-6 text-[#6E6E6E]">{subtitle}</p>}
      {children}
    </div>
  );
}

export const settingIcons: Record<string, ReactNode> = {
  profile: <UserRound size={18} />,
  account: <ShieldCheck size={18} />,
  password: <ShieldCheck size={18} />,
  visibility: <Monitor size={18} />,
  proof: <FileText size={18} />,
  intro: <MessageCircle size={18} />,
  blocked: <ShieldCheck size={18} />,
  push: <Bell size={18} />,
  email: <MessageCircle size={18} />,
  feedback: <MessageCircle size={18} />,
  content: <BookOpen size={18} />,
  theme: <Monitor size={18} />,
  help: <HelpCircle size={18} />,
  support: <MessageCircle size={18} />,
  signout: <ShieldCheck size={18} />,
  badge: <BadgeCheck size={18} />
};

export function SaveBar({ label = "Save changes" }: { label?: string }) {
  return (
    <Button type="button" className="w-full" onClick={() => undefined}>
      {label}
    </Button>
  );
}

export function PassportTextInput(props: ComponentPropsWithoutRef<"input">) {
  return <TextInput {...props} />;
}

export function PassportTextArea(props: ComponentPropsWithoutRef<"textarea">) {
  return <TextArea {...props} />;
}
