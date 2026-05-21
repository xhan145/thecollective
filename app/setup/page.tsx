import { AppShell } from "@/components/AppShell";
import { SetupChecklist } from "@/components/SetupChecklist";

export default function SetupPage() {
  return (
    <AppShell title="Setup" subtitle="Demo mode first. Connect storage, AI, and moderation later.">
      <div className="space-y-4">
        <div className="glass-panel p-5">
          <h2 className="text-xl font-black">Demo mode is on</h2>
          <p className="mt-2 text-sm leading-6 text-[#c8c2b8]">You can preview multimodal proof, photo and video swipe lanes, and intent-based engagement before Supabase or OpenAI are connected. The app validates files locally, stores demo metadata, and returns fallback feedback.</p>
        </div>
        <SetupChecklist />
      </div>
    </AppShell>
  );
}
