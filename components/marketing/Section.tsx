import type { ReactNode } from "react";

const BG: Record<string, string> = {
  cream: "bg-[#FFF8EE]",
  surface: "bg-[#FFFDF8]",
  gold: "bg-[#FFF1C7]",
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
    <section id={id} className={`w-full ${BG[bg]} ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-5 py-16 lg:px-8 lg:py-24">{children}</div>
    </section>
  );
}
