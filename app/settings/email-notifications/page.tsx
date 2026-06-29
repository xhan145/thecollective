"use client";

import { NotificationSettingsGroup } from "@/components/beta/NotificationSettingsGroup";
import { EMAIL_TOGGLES } from "@/lib/settings/userSettings";

export default function EmailNotificationsPage() {
  return <NotificationSettingsGroup title="Email notifications" subtitle="What lands in your inbox." toggles={EMAIL_TOGGLES} lockedKeys={["email.accountNotices"]} />;
}
