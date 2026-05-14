import { AppShell } from "@/components/AppShell";
import { FeedbackDisplay } from "@/components/FeedbackDisplay";

export default function FeedbackPage() {
  return (
    <AppShell title="Feedback" subtitle="Media-aware demo feedback. Connect OpenAI later for live generation.">
      <FeedbackDisplay />
    </AppShell>
  );
}
