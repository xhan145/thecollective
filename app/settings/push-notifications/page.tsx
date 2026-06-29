"use client";

import { NotificationSettingsGroup } from "@/components/beta/NotificationSettingsGroup";
import { PUSH_TOGGLES } from "@/lib/settings/userSettings";

export default function PushNotificationsPage() {
  return <NotificationSettingsGroup title="Push notifications" subtitle="Gentle nudges, never noise." toggles={PUSH_TOGGLES} />;
}
