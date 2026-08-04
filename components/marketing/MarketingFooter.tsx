import Link from "next/link";
import { MARKETING } from "@/lib/marketing/content";
import { CollectiveWordmark } from "@/components/beta/Brand";

export default function MarketingFooter() {
  return (
    <footer className="w-full border-t border-line bg-surface">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <CollectiveWordmark />
          <p className="mt-3 max-w-[220px] text-body leading-6 text-muted">Small steps. Real progress.</p>
        </div>
        {MARKETING.footer.columns.map((col) => (
          <div key={col.heading}>
            <p className="text-caption font-semibold uppercase tracking-wider text-muted">{col.heading}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.label}><Link href={l.href} className="text-body font-medium text-secondary hover:text-content">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 border-t border-line px-5 py-6 sm:flex-row lg:px-8">
        <p className="text-caption text-muted">© 2026 Collective. Proof over performance.</p>
        <div className="flex gap-4">
          {MARKETING.footer.socials.map((s) => (
            <Link key={s.label} href={s.href} className="text-caption font-medium text-muted hover:text-content">{s.label}</Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
