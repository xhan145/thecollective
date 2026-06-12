import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { CollectiveMiniMark } from "./Brand";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <CollectiveMiniMark className="h-7 w-11" />
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#6E6E6E]">Collective</span>
        </div>
        <h1 className="text-[31px] font-extrabold leading-tight tracking-tight text-[#111111]">{title}</h1>
        {subtitle && <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function Card({ children, className = "", asButton = false, ...props }: ComponentPropsWithoutRef<"div"> & { asButton?: boolean }) {
  const classes = `rounded-[22px] border border-[#EFE7D8] bg-[#FFFDF8] shadow-[0_16px_42px_rgba(71,52,18,0.08)] ${className}`;
  if (asButton) {
    return (
      <div role="button" tabIndex={0} className={`${classes} active:scale-[0.99] transition`} {...props}>
        {children}
      </div>
    );
  }
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }: ComponentPropsWithoutRef<"button"> & { variant?: "primary" | "secondary" | "quiet" }) {
  const styles =
    variant === "primary"
      ? "bg-[#F2A900] text-white shadow-[0_12px_28px_rgba(242,169,0,0.24)]"
      : variant === "secondary"
        ? "border border-[#EFE7D8] bg-[#FFF8EE] text-[#111111]"
        : "bg-transparent text-[#6E6E6E]";
  return (
    <button
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-extrabold transition active:scale-[0.98] disabled:opacity-50 ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({ children, variant = "primary", className = "", ...props }: ComponentPropsWithoutRef<typeof Link> & { variant?: "primary" | "secondary" | "quiet" }) {
  const styles =
    variant === "primary"
      ? "bg-[#F2A900] text-white shadow-[0_12px_28px_rgba(242,169,0,0.24)]"
      : variant === "secondary"
        ? "border border-[#EFE7D8] bg-[#FFF8EE] text-[#111111]"
        : "bg-transparent text-[#6E6E6E]";
  return (
    <Link className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-extrabold transition active:scale-[0.98] ${styles} ${className}`} {...props}>
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
      <CollectiveMiniMark className="mx-auto h-12 w-20" />
      <h3 className="mt-4 text-xl font-extrabold text-[#111111]">{title}</h3>
      <p className="mx-auto mt-2 max-w-[270px] text-sm leading-6 text-[#6E6E6E]">{body}</p>
      {cta && <div className="mt-5">{cta}</div>}
    </Card>
  );
}

export function SuccessState({ title, body, cta }: { title: string; body: string; cta?: ReactNode }) {
  return (
    <Card className="p-7 text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#FFF1C7] text-4xl font-black text-[#F2A900]">✓</div>
      <h3 className="mt-4 text-xl font-extrabold text-[#111111]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">{body}</p>
      {cta && <div className="mt-5">{cta}</div>}
    </Card>
  );
}

export function TextArea({ className = "", ...props }: ComponentPropsWithoutRef<"textarea">) {
  return (
    <textarea
      className={`min-h-32 w-full rounded-[18px] border border-[#EFE7D8] bg-white px-4 py-3 text-sm leading-6 text-[#111111] outline-none placeholder:text-[#9B958B] focus:border-[#F2A900] focus:ring-4 focus:ring-[#FFF1C7] ${className}`}
      {...props}
    />
  );
}

export function TextInput({ className = "", ...props }: ComponentPropsWithoutRef<"input">) {
  return (
    <input
      className={`min-h-12 w-full rounded-[18px] border border-[#EFE7D8] bg-white px-4 text-sm text-[#111111] outline-none placeholder:text-[#9B958B] focus:border-[#F2A900] focus:ring-4 focus:ring-[#FFF1C7] ${className}`}
      {...props}
    />
  );
}
