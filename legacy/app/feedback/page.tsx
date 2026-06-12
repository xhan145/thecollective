import { AppShell } from "@/components/AppShell";
import { FeedbackDisplay } from "@/components/FeedbackDisplay";

export default function FeedbackPage() {
  return (
    <AppShell title="Feedback" subtitle="AI can support reflection, but useful human feedback still matters.">
      <FeedbackDisplay />
    </AppShell>
  );
}
