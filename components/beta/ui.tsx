"use client";

import Link from "next/link";
import { motion, type HTMLMotionProps } from "framer-motion";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { CollectiveMiniMark } from "./Brand";
import { Reveal, easeOut } from "./motion";

// Material-ish elevation tuned to the warm brand (brown-tinted shadows).
const ELEVATION =
  "shadow-[0_1px_2px_rgba(71,52,18,0.06),0_10px_30px_rgba(71,52,18,0.08)]";
const ELEVATION_HOVER =
  "0 4px 10px rgba(71,52,18,0.10), 0 18px 44px rgba(71,52,18,0.14)";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <Reveal>
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <CollectiveMiniMark className="h-7 w-11" />
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E6E6E]">Collective</span>
          </div>
          <h1 className="font-display text-[31px] font-bold leading-tight tracking-tight text-[#111111]">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">{subtitle}</p>}
        </div>
        {action}
      </header>
    </Reveal>
  );
}

export function Card({
  children,
  className = "",
  asButton = false,
  interactive = false,
  ...props
}: HTMLMotionProps<"div"> & { asButton?: boolean; interactive?: boolean }) {
  const lift = asButton || interactive;
  return (
    <motion.div
      role={asButton ? "button" : undefined}
      tabIndex={asButton ? 0 : undefined}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: easeOut }}
      whileHover={lift ? { y: -3, boxShadow: ELEVATION_HOVER } : undefined}
      whileTap={lift ? { scale: 0.99 } : undefined}
      className={`rounded-[22px] border border-[#EFE7D8] bg-[#FFFDF8] ${ELEVATION} ${lift ? "cursor-pointer" : ""} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

const buttonStyles = {
  primary: "bg-gradient-to-r from-[#FFB000] to-[#F2A900] text-white shadow-[0_10px_24px_rgba(242,169,0,0.32)]",
  secondary: "border border-[#EFE7D8] bg-[#FFF8EE] text-[#111111]",
  quiet: "bg-transparent text-[#6E6E6E]"
} as const;

type ButtonVariant = keyof typeof buttonStyles;

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: HTMLMotionProps<"button"> & { variant?: ButtonVariant }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={variant === "primary" ? { y: -1, boxShadow: "0 14px 30px rgba(242,169,0,0.38)" } : { y: -1 }}
      transition={{ duration: 0.2, ease: easeOut }}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-extrabold disabled:opacity-50 ${buttonStyles[variant]} ${className} outline-none transition-transform active:scale-95 focus-visible:ring-4 focus-visible:ring-[#F2A900]/40`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function ButtonLink({
  children,
  variant = "primary",
  className = "",
  ...props
}: ComponentPropsWithoutRef<typeof Link> & { variant?: ButtonVariant }) {
  return (
    <Link
      className={`group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-extrabold transition-all duration-200 active:scale-[0.96] hover:-translate-y-[1px] ${buttonStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

export function Badge({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "green" | "muted" }) {
  const styles =
    tone === "green"
      ? "bg-[#E8F8EE] text-[#17743B]"
      : tone === "muted"
        ? "bg-[#FFF8EE] text-[#6E6E6E]"
        : "bg-[#FFF1C7] text-[#7A5300]";
  return <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] font-extrabold ${styles}`}>{children}</span>;
}

export function SectionLabel({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[17px] font-extrabold text-[#111111]">{title}</h2>
      {action}
    </div>
  );
}

export function TrustPill({ label }: { label: string }) {
  return <Badge tone="gold">{label}</Badge>;
}

export function EmptyState({ title, body, cta }: { title: string; body: string; cta?: ReactNode }) {
  return (
    <Card className="p-7 text-center">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: easeOut }}
      >
        <CollectiveMiniMark className="mx-auto h-12 w-20" />
      </motion.div>
      <p className="font-display text-lg font-bold text-[#111111]">{title}</p>
      <p className="mx-auto mt-2 max-w-[270px] text-sm leading-6 text-[#6E6E6E]">{body}</p>
      {cta && <div className="mt-5">{cta}</div>}
    </Card>
  );
}

export function SuccessState({ title, body, cta }: { title: string; body: string; cta?: ReactNode }) {
  return (
    <Card className="p-7 text-center">
      <motion.div
        className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#FFF1C7] text-4xl font-black text-[#F2A900]"
        initial={{ scale: 0, rotate: -25 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.05 }}
      >
        ✓
      </motion.div>
      <h3 className="mt-4 text-xl font-extrabold text-[#111111]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">{body}</p>
      {cta && <div className="mt-5">{cta}</div>}
    </Card>
  );
}

export function TextArea({ className = "", ...props }: ComponentPropsWithoutRef<"textarea">) {
  return (
    <textarea
      className={`min-h-32 w-full rounded-[18px] border border-[#EFE7D8] bg-white px-4 py-3 text-sm leading-6 text-[#111111] outline-none transition placeholder:text-[#9B958B] focus:border-[#F2A900] focus:ring-4 focus:ring-[#FFF1C7] ${className}`}
      {...props}
    />
  );
}

export function TextInput({ className = "", ...props }: ComponentPropsWithoutRef<"input">) {
  return (
    <input
      className={`min-h-12 w-full rounded-[18px] border border-[#EFE7D8] bg-white px-4 text-sm text-[#111111] outline-none transition placeholder:text-[#9B958B] focus:border-[#F2A900] focus:ring-4 focus:ring-[#FFF1C7] ${className}`}
      {...props}
    />
  );
}

/** Visual representation of the Collective loop. Plain chips, or numbered steps. */
export function LoopStrip({ numbered = false, steps = ["Practice", "Prove", "Feedback", "Trust"] }: { numbered?: boolean; steps?: string[] }) {
  if (numbered) {
    return (
      <div className="flex items-center gap-1.5" role="list" aria-label="How Collective works">
        {steps.map((s, i) => (
          <div key={s} role="listitem" className="flex-1 text-center">
            <span className="mx-auto mb-1 grid h-7 w-7 place-items-center rounded-full bg-[#FFE7AE] text-[11px] font-extrabold text-[#7A5300]">{i + 1}</span>
            <span className="block text-[10px] font-bold text-[#B07A00]">{s}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5" role="list" aria-label="How Collective works">
      {steps.map((s) => (
        <span key={s} role="listitem" className="rounded-full bg-[#FFF1C7] px-3 py-1 text-[11px] font-bold text-[#7A5300]">{s}</span>
      ))}
    </div>
  );
}

/** Calm weekly-progress bar (gold fill). value is 0–100. */
export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div>
      {label && <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#9B958B]">{label}</p>}
      <div className="h-2 overflow-hidden rounded-full bg-[#FFE7AE]" role="progressbar" aria-label={label ?? "Progress"} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-gradient-to-r from-[#FFB000] to-[#F2A900] transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Focal "hero" surface: warm cream→gold gradient card for the one key action on a screen. */
export function HeroCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[24px] border border-[#F6E7C8] bg-gradient-to-br from-[#FFF1C7] to-[#FFFDF8] p-5 shadow-[0_12px_30px_rgba(71,52,18,0.12)] ${className}`}>
      {children}
    </div>
  );
}
