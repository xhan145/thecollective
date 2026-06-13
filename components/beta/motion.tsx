"use client";

import { animate, motion, useMotionValue, useTransform, type Variants } from "framer-motion";
import { useEffect, type ReactNode } from "react";

export const easeOut = [0.22, 1, 0.36, 1] as const;

export const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } }
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: easeOut } }
};

/** Stagger container — children wrapped in <MotionItem> reveal in sequence. */
export function MotionList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={listVariants} initial="hidden" animate="show">
      {children}
    </motion.div>
  );
}

export function MotionItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

/** One-shot fade + rise. */
export function Reveal({
  children,
  className,
  delay = 0
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeOut, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Animated number count-up. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  useEffect(() => {
    const controls = animate(count, value, { duration: 0.9, ease: easeOut });
    return () => controls.stop();
  }, [count, value]);
  return <motion.span className={className}>{rounded}</motion.span>;
}

/** Shimmering skeleton placeholder for loading states. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[18px] bg-[#F2E9D8] ${className}`}>
      <motion.div
        className="absolute inset-0"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.65), transparent)" }}
        animate={{ x: ["-110%", "110%"] }}
        transition={{ repeat: Infinity, duration: 1.3, ease: "linear" }}
      />
    </div>
  );
}

/** Generic loading screen for authed routes while data loads. */
export function ScreenSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-28 w-full" />
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

/** Progress bar that animates its fill on mount / when value changes. */
export function AnimatedBar({ value, className = "" }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-[#EFE7D8] ${className}`}>
      <motion.div
        className="h-full rounded-full bg-[#F2A900]"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: easeOut }}
      />
    </div>
  );
}
