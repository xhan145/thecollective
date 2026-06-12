import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { GrowthPath } from "@/lib/types";

export function PathCard({ path }: { path: GrowthPath }) {
  return (
    <Link href={`/paths/${path.slug}`} className="soft-card block p-4 transition active:scale-[0.99]">
      <div className={`mb-4 h-12 w-12 rounded-3xl bg-gradient-to-br ${path.color} shadow-soft`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black">{path.title}</h3>
          <p className="mt-1 text-sm leading-6 text-[#c8c2b8]">{path.description}</p>
        </div>
        <ArrowRight className="mt-1 text-[#8f887e]" size={18} />
      </div>
      <p className="mt-4 surface-row p-3 text-xs leading-5 text-[#c8c2b8]">{path.promise}</p>
    </Link>
  );
}
