import type { ReactNode } from "react";
import AmbientBackdrop from "@/components/beta/AmbientBackdrop";

const BG: Record<string, string> = {
  cream: "bg-bg",
  surface: "bg-surface",
  gold: "bg-surface-soft",
};

export default function Section({
  id,
  bg = "cream",
  className = "",
  children,
}: {
  id?: string;
  bg?: "cream" | "surface" | "gold";
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`relative w-full ${BG[bg]} ${className}`}>
      {/* Gold bands stay clean; cream/surface sections get the drifting aurora. */}
      {bg !== "gold" && <AmbientBackdrop />}
      <div className="relative z-[1] mx-auto w-full max-w-6xl px-5 py-16 lg:px-8 lg:py-24">{children}</div>
    </section>
  );
}
