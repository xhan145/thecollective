"use client";

import Link from "next/link";
import { motion, type HTMLMotionProps } from "framer-motion";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { CollectiveMiniMark } from "./Brand";
import { Reveal, easeOut } from "./motion";

// UUPM elevation scale tuned to the warm brand (brown-tinted, 3-layer:
// crisp contact + mid + wide ambient). Single source — every Card inherits.
const ELEVATION =
  "shadow-[0_1px_2px_rgba(71,52,18,0.06),0_8px_22px_rgba(71,52,18,0.08),0_22px_54px_rgba(71,52,18,0.06)]";
const ELEVATION_HOVER =
  "0 4px 10px rgba(71,52,18,0.10), 0 20px 48px rgba(71,52,18,0.13), 0 34px 80px rgba(71,52,18,0.08)";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <Reveal>
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <CollectiveMiniMark className="h-7 w-11" />
            <span className="text-caption font-medium uppercase tracking-[0.14em] text-muted">Collective</span>
          </div>
          {/* Plain ink here by design: the gold gradient heading is reserved for
              hero moments (landing) — on all ~40 PageHeaders it reads as gilt. */}
          <h1 className="font-display text-title leading-tight tracking-tight text-content">{title}</h1>
          {subtitle && <p className="mt-2 text-body leading-6 text-muted">{subtitle}</p>}
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
      className={`rounded-[22px] border border-line bg-surface ${ELEVATION} ${lift ? "cursor-pointer" : ""} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

const buttonStyles = {
  primary: "bg-gradient-to-r from-accent to-accent text-white shadow-[0_10px_24px_rgba(242,169,0,0.32)]",
  secondary: "border border-line bg-bg text-content",
  quiet: "bg-transparent text-muted"
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
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-body font-semibold disabled:opacity-50 ${buttonStyles[variant]} ${className} outline-none transition-transform active:scale-95 focus-visible:ring-4 focus-visible:ring-accent/40`}
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
      className={`group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-body font-semibold transition-all duration-200 active:scale-[0.96] hover:-translate-y-[1px] ${buttonStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

export function Badge({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "green" | "muted" }) {
  const styles =
    tone === "green"
      ? "bg-success-soft text-success-text"
      : tone === "muted"
        ? "bg-bg text-muted"
        : "bg-surface-soft text-accent-text";
  return <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-overline ${styles}`}>{children}</span>;
}

export function SectionLabel({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-body-lg font-semibold text-content">{title}</h2>
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
      <p className="font-display text-heading text-content">{title}</p>
      <p className="mx-auto mt-2 max-w-[270px] text-body leading-6 text-muted">{body}</p>
      {cta && <div className="mt-5">{cta}</div>}
    </Card>
  );
}

export function SuccessState({ title, body, cta }: { title: string; body: string; cta?: ReactNode }) {
  return (
    <Card className="p-7 text-center">
      <motion.div
        className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-surface-soft text-display text-accent"
        initial={{ scale: 0, rotate: -25 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.05 }}
      >
        ✓
      </motion.div>
      <h3 className="mt-4 text-heading text-content">{title}</h3>
      <p className="mt-2 text-body leading-6 text-muted">{body}</p>
      {cta && <div className="mt-5">{cta}</div>}
    </Card>
  );
}

export function TextArea({ className = "", ...props }: ComponentPropsWithoutRef<"textarea">) {
  return (
    <textarea
      className={`min-h-32 w-full rounded-[18px] border border-line bg-white px-4 py-3 text-body leading-6 text-content outline-none transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-surface-soft ${className}`}
      {...props}
    />
  );
}

export function TextInput({ className = "", ...props }: ComponentPropsWithoutRef<"input">) {
  return (
    <input
      className={`min-h-12 w-full rounded-[18px] border border-line bg-white px-4 text-body text-content outline-none transition placeholder:text-muted focus:border-accent focus:ring-4 focus:ring-surface-soft ${className}`}
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
            <span className="mx-auto mb-1 grid h-7 w-7 place-items-center rounded-full bg-accent-soft text-overline text-accent-text">{i + 1}</span>
            <span className="block text-overline text-accent-text">{s}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5" role="list" aria-label="How Collective works">
      {steps.map((s) => (
        <span key={s} role="listitem" className="rounded-full bg-surface-soft px-3 py-1 text-overline text-accent-text">{s}</span>
      ))}
    </div>
  );
}

/** Calm weekly-progress bar (gold fill). value is 0–100. */
export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div>
      {label && <p className="mb-1.5 text-overline uppercase tracking-[0.12em] text-muted">{label}</p>}
      <div className="h-2 overflow-hidden rounded-full bg-accent-soft" role="progressbar" aria-label={label ?? "Progress"} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Focal "hero" surface: warm cream→gold gradient card for the one key action on a screen. */
export function HeroCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-[24px] border border-accent-soft bg-gradient-to-br from-surface-soft to-surface p-5 shadow-[0_2px_4px_rgba(71,52,18,0.06),0_14px_34px_rgba(71,52,18,0.12),0_30px_70px_rgba(71,52,18,0.07)] ${className}`}>
      {/* Soft gold glow behind the hero moment — breathes when motion allowed. */}
      <div aria-hidden className="mk-breathe pointer-events-none absolute -inset-4 -z-10 rounded-[32px] bg-[radial-gradient(60%_70%_at_50%_20%,rgba(242,169,0,0.12),transparent_75%)]" />
      {children}
    </div>
  );
}
