import { AppShell } from "@/components/AppShell";
import { SetupChecklist } from "@/components/SetupChecklist";

export default function SetupPage() {
  return (
    <AppShell title="Setup" subtitle="Demo mode first. Connect storage and AI later.">
      <div className="space-y-4">
        <div className="card p-5">
          <h2 className="text-xl font-black">Beginner mode is on</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">You can preview the multimodal proof flow before Supabase or OpenAI are connected. The app validates files locally, stores demo metadata, and returns fallback feedback.</p>
        </div>
        <SetupChecklist />
      </div>
    </AppShell>
  );
}
