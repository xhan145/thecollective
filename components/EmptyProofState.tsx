import Link from "next/link";
import { PenLine } from "lucide-react";

export function EmptyProofState() {
  return (
    <div className="glass-panel p-6 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-3xl bg-white/10 text-purple2 shadow-soft">
        <PenLine size={20} />
      </div>
      <h2 className="text-lg font-black">Your first proof can be small</h2>
      <p className="mt-2 text-sm leading-6 text-[#c8c2b8]">Practice once. Reflect briefly. Add media only if it helps show the work.</p>
      <Link href="/proof/new" className="btn-primary mt-4 w-full">Submit proof</Link>
    </div>
  );
}
