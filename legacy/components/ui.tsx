import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

export function SoftCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`soft-card ${className}`}>{children}</div>;
}

export function SectionHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="section-header">
      <div>
        {eyebrow && <p className="section-eyebrow">{eyebrow}</p>}
        <h2 className="section-title">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Pill({ children, tone = "neutral", className = "" }: { children: ReactNode; tone?: "neutral" | "accent" | "success" | "warning" | "muted"; className?: string }) {
  return <span className={`pill pill-${tone} ${className}`}>{children}</span>;
}

export function PrimaryButton({ children, className = "", ...props }: ComponentPropsWithoutRef<"button">) {
  return <button className={`btn-primary ${className}`} {...props}>{children}</button>;
}

export function SecondaryButton({ children, className = "", ...props }: ComponentPropsWithoutRef<"button">) {
  return <button className={`btn-secondary ${className}`} {...props}>{children}</button>;
}

export function PrimaryLink({ children, className = "", ...props }: ComponentPropsWithoutRef<typeof Link>) {
  return <Link className={`btn-primary ${className}`} {...props}>{children}</Link>;
}

export function SecondaryLink({ children, className = "", ...props }: ComponentPropsWithoutRef<typeof Link>) {
  return <Link className={`btn-secondary ${className}`} {...props}>{children}</Link>;
}

export function TextArea({ className = "", ...props }: ComponentPropsWithoutRef<"textarea">) {
  return <textarea className={`input min-h-28 ${className}`} {...props} />;
}

export function ProgressMetric({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="metric-card">
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      {helper && <p className="metric-helper">{helper}</p>}
    </div>
  );
}
