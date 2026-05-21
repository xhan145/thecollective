import { AppShell } from "@/components/AppShell";
import { PathCard } from "@/components/PathCard";
import { paths } from "@/lib/data";

export default function PathsPage() {
  return (
    <AppShell title="Practice paths" subtitle="Small practices for confidence, communication, and momentum.">
      <div className="space-y-4">{paths.map((path) => <PathCard key={path.slug} path={path} />)}</div>
    </AppShell>
  );
}
