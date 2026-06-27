import Link from "next/link";
import { MARKETING } from "@/lib/marketing/content";
import { CollectiveWordmark } from "@/components/beta/Brand";

export default function MarketingFooter() {
  return (
    <footer className="w-full border-t border-[#EFE7D8] bg-[#FFFDF8]">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <CollectiveWordmark />
          <p className="mt-3 max-w-[220px] text-sm leading-6 text-[#6E6E6E]">Small steps. Real progress.</p>
        </div>
        {MARKETING.footer.columns.map((col) => (
          <div key={col.heading}>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#9B958B]">{col.heading}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.label}><Link href={l.href} className="text-sm font-bold text-[#38322A] hover:text-[#111111]">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 border-t border-[#EFE7D8] px-5 py-6 sm:flex-row lg:px-8">
        <p className="text-xs text-[#9B958B]">© 2026 Collective. Proof over performance.</p>
        <div className="flex gap-4">
          {MARKETING.footer.socials.map((s) => (
            <Link key={s.label} href={s.href} className="text-xs font-bold text-[#6E6E6E] hover:text-[#111111]">{s.label}</Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
