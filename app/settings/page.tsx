"use client";

import { Bell, BookOpen, Camera, Compass, MessageSquare, ShieldCheck, Sparkles, Sun, User } from "lucide-react";
import { AppShell } from "@/components/beta/AppShell";
import { PageHeader } from "@/components/beta/ui";
import { SettingsRow, SettingsSection } from "@/components/beta/SettingsKit";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Settings" subtitle="Make Collective comfortable and safe for you." />

        <SettingsSection title="Account">
          <SettingsRow icon={<User size={16} />} title="Edit profile" subtitle="Name, headline, focus" href="/passport/edit" />
          <SettingsRow icon={<ShieldCheck size={16} />} title="Account information" subtitle="Email, status, trust" href="/settings/account" />
          <SettingsRow icon={<ShieldCheck size={16} />} title="Change password" href="/settings/change-password" />
        </SettingsSection>

        <SettingsSection title="Privacy & visibility">
          <SettingsRow icon={<ShieldCheck size={16} />} title="Profile visibility" subtitle="Who can see your passport" href="/settings/profile-visibility" />
          <SettingsRow icon={<Camera size={16} />} title="Proof visibility" subtitle="Default for new proof" href="/settings/proof-visibility" />
          <SettingsRow icon={<Compass size={16} />} title="Introduction preferences" href="/settings/introduction-preferences" />
          <SettingsRow icon={<ShieldCheck size={16} />} title="Blocked members" href="/settings/blocked-users" />
        </SettingsSection>

        <SettingsSection title="Notifications">
          <SettingsRow icon={<Bell size={16} />} title="Push notifications" href="/settings/push-notifications" />
          <SettingsRow icon={<MessageSquare size={16} />} title="Email notifications" href="/settings/email-notifications" />
          <SettingsRow icon={<MessageSquare size={16} />} title="Feedback notifications" href="/settings/feedback-notifications" />
        </SettingsSection>

        <SettingsSection title="Preferences">
          <SettingsRow icon={<MessageSquare size={16} />} title="Feedback preferences" href="/settings/feedback-preferences" />
          <SettingsRow icon={<Sparkles size={16} />} title="Content preferences" href="/settings/content-preferences" />
          <SettingsRow icon={<Sun size={16} />} title="Theme" subtitle="Light, dark, or system" href="/settings/theme" />
          <SettingsRow icon={<Sparkles size={16} />} title="Customization" subtitle="Pixel style & feel" href="/settings/customization" />
        </SettingsSection>

        <SettingsSection title="Support">
          <SettingsRow icon={<BookOpen size={16} />} title="Help center" href="/settings/help" />
          <SettingsRow icon={<MessageSquare size={16} />} title="Contact support" href="/settings/contact-support" />
          <SettingsRow icon={<Sparkles size={16} />} title="Give feedback" subtitle="Help shape Collective" href="/settings/give-feedback" />
        </SettingsSection>

        <SettingsSection title="Account action">
          <SettingsRow icon={<User size={16} />} title="Sign out" href="/settings/sign-out" />
        </SettingsSection>
      </div>
    </AppShell>
  );
}
