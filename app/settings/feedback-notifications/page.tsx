"use client";

import { NotificationSettingsGroup } from "@/components/beta/NotificationSettingsGroup";
import { FEEDBACK_TOGGLES } from "@/lib/settings/userSettings";

export default function FeedbackNotificationsPage() {
  return <NotificationSettingsGroup title="Feedback notifications" subtitle="Stay in the loop on your proof." toggles={FEEDBACK_TOGGLES} />;
}
