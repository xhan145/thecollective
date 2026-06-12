import Link from "next/link";
import type { ReactNode } from "react";
import { SignalFlowLogo } from "@/components/SignalFlowLogo";

export function SignalFlowCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-card border border-line bg-card p-4 shadow-warm ${className}`}>
      {children}
    </div>
  );
}

export function Card({
  children,
  className = "",
  soft = false,
}: {
  children: ReactNode;
  className?: string;
  soft?: boolean;
}) {
  return (
    <SignalFlowCard className={`${soft ? "bg-soft" : ""} ${className}`}>
      {children}
    </SignalFlowCard>
  );
}

export function PrimaryButton({
  children,
  href,
  type = "button",
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const cls = `inline-flex w-full items-center justify-center gap-2 rounded-card bg-signal px-4 py-3 text-center text-sm font-black text-night shadow-warmLg transition active:scale-[0.99] disabled:opacity-50 ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  href,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  href?: string;
  type?: "button" | "submit";
  className?: string;
}) {
  const cls = `inline-flex w-full items-center justify-center gap-2 rounded-card border border-line bg-cardHi px-4 py-3 text-center text-sm font-bold text-ink transition active:scale-[0.99] ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls}>
      {children}
    </button>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 mt-6 text-[11px] font-black uppercase tracking-[0.16em] text-signal">
      {children}
    </p>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-line bg-soft px-2.5 py-1 text-[11px] font-bold text-muted">
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  body,
  actionLabel,
  actionHref,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <SignalFlowLogo size={56} />
      <p className="text-lg font-black text-ink">{title}</p>
      <p className="max-w-[280px] text-sm leading-relaxed text-muted">{body}</p>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="mt-1 rounded-card bg-signal px-5 py-2.5 text-sm font-black text-night shadow-warmLg"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function LoadingState({ label = "The Flow is listening." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-card border border-line bg-card p-4 text-sm font-bold text-muted">
      <span className="h-2 w-2 animate-pulse rounded-full bg-signal" />
      {label}
    </div>
  );
}

export function TextField({
  label,
  name,
  placeholder,
  multiline = false,
  required = false,
  rows = 3,
  defaultValue = "",
  type = "text",
  help,
}: {
  label: string;
  name: string;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
  rows?: number;
  defaultValue?: string;
  type?: string;
  help?: string;
}) {
  const cls =
    "w-full rounded-card border border-line bg-night/60 px-3.5 py-3 text-[15px] text-ink outline-none transition focus:border-signal focus:ring-2 focus:ring-signal/15";
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-ink">{label}</span>
      {multiline ? (
        <textarea
          name={name}
          placeholder={placeholder}
          required={required}
          rows={rows}
          defaultValue={defaultValue}
          className={cls}
        />
      ) : (
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          defaultValue={defaultValue}
          className={cls}
        />
      )}
      {help ? <span className="mt-1.5 block text-xs text-muted">{help}</span> : null}
    </label>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: "border-success/30 bg-success/10 text-success",
    pending_review: "border-warning/30 bg-warning/10 text-warning",
    rejected: "border-danger/30 bg-danger/10 text-danger",
    draft: "border-muted/30 bg-soft text-muted",
    first_50: "border-signal/30 bg-signal/10 text-signal",
    rising: "border-pulse/30 bg-pulse/10 text-pulse",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${
        styles[status] ?? "border-line bg-soft text-muted"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
