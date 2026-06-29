import { AppShell } from "@/components/beta/AppShell";
import { CollectiveMiniMark } from "@/components/beta/Brand";
import { SettingsRow, SettingsSection, settingIcons } from "@/components/passport/PassportComponents";
import { settingsSections } from "@/lib/passportData";

function iconForTitle(title: string) {
  const key = title.toLowerCase();
  if (key.includes("profile")) return settingIcons.profile;
  if (key.includes("account")) return settingIcons.account;
  if (key.includes("password")) return settingIcons.password;
  if (key.includes("proof")) return settingIcons.proof;
  if (key.includes("visibility")) return settingIcons.visibility;
  if (key.includes("introduction")) return settingIcons.intro;
  if (key.includes("blocked")) return settingIcons.blocked;
  if (key.includes("push")) return settingIcons.push;
  if (key.includes("email")) return settingIcons.email;
  if (key.includes("feedback")) return settingIcons.feedback;
  if (key.includes("content")) return settingIcons.content;
  if (key.includes("theme")) return settingIcons.theme;
  if (key.includes("help")) return settingIcons.help;
  if (key.includes("support")) return settingIcons.support;
  if (key.includes("sign")) return settingIcons.signout;
  return settingIcons.account;
}

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <header className="text-center">
          <CollectiveMiniMark className="mx-auto h-9 w-14" />
          <h1 className="mt-3 text-[28px] font-black text-[#111111]">Settings</h1>
          <p className="mx-auto mt-2 max-w-[310px] text-sm leading-6 text-[#6E6E6E]">
            Control privacy, preferences, notifications, and support in one calm place.
          </p>
        </header>
        <div className="space-y-5">
          {settingsSections.map((section) => (
            <SettingsSection key={section.label} label={section.label}>
              {section.rows.map((row) => (
                <SettingsRow
                  key={row.href}
                  title={row.title}
                  subtitle={row.subtitle}
                  href={row.href}
                  danger={"danger" in row && row.danger}
                  icon={iconForTitle(row.title)}
                />
              ))}
            </SettingsSection>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
