import { notFound } from "next/navigation";
import { AppShell } from "@/components/beta/AppShell";
import { Button, Card } from "@/components/beta/ui";
import {
  FormFieldCard,
  PassportTextArea,
  PassportTextInput,
  PreferenceChip,
  RadioOptionCard,
  SaveBar,
  SettingsPageShell,
  SettingsSection,
  ToggleRow
} from "@/components/passport/PassportComponents";

type SettingsConfig = {
  title: string;
  subtitle: string;
  kind:
    | "account"
    | "password"
    | "profile-visibility"
    | "proof-visibility"
    | "introduction"
    | "blocked"
    | "push"
    | "email"
    | "feedback-notifications"
    | "feedback-preferences"
    | "content-preferences"
    | "theme"
    | "help"
    | "support"
    | "product-feedback"
    | "sign-out";
};

const settingsConfigs: Record<string, SettingsConfig> = {
  account: {
    title: "Account Information",
    subtitle: "Private account details stay out of public Passport views.",
    kind: "account"
  },
  "change-password": {
    title: "Change Password",
    subtitle: "Use a strong password and update it only when you are ready.",
    kind: "password"
  },
  "profile-visibility": {
    title: "Profile Visibility",
    subtitle: "Choose who can view your Passport.",
    kind: "profile-visibility"
  },
  "proof-visibility": {
    title: "Proof Visibility",
    subtitle: "Proof visibility is separate from Passport visibility.",
    kind: "proof-visibility"
  },
  "introduction-preferences": {
    title: "Introduction Preferences",
    subtitle: "Control who can safely ask to connect around practice.",
    kind: "introduction"
  },
  "blocked-users": {
    title: "Blocked Users",
    subtitle: "Blocked members cannot view, message, introduce, or interact with visible proof.",
    kind: "blocked"
  },
  "push-notifications": {
    title: "Push Notifications",
    subtitle: "Keep reminders useful and quiet.",
    kind: "push"
  },
  "email-notifications": {
    title: "Email Notifications",
    subtitle: "Choose what should arrive by email.",
    kind: "email"
  },
  "feedback-notifications": {
    title: "Feedback Notifications",
    subtitle: "Feedback should support progress, not pressure.",
    kind: "feedback-notifications"
  },
  "feedback-preferences": {
    title: "Feedback Preferences",
    subtitle: "Tell Collective what kind of feedback is most useful.",
    kind: "feedback-preferences"
  },
  "content-preferences": {
    title: "Content Preferences",
    subtitle: "Tune practice directions without creating an endless feed.",
    kind: "content-preferences"
  },
  theme: {
    title: "Theme",
    subtitle: "Prepare light, dark, and system display preferences.",
    kind: "theme"
  },
  help: {
    title: "Help Center",
    subtitle: "Find product guidance for practice, proof, feedback, trust, and privacy.",
    kind: "help"
  },
  "contact-support": {
    title: "Contact Support",
    subtitle: "Send a message, report a bug, or raise a safety concern.",
    kind: "support"
  },
  "give-feedback": {
    title: "Give Feedback",
    subtitle: "Product feedback helps make Collective easier to use.",
    kind: "product-feedback"
  },
  "sign-out": {
    title: "Sign Out",
    subtitle: "Confirm before leaving this session.",
    kind: "sign-out"
  }
};

export function generateStaticParams() {
  return Object.keys(settingsConfigs).map((section) => ({ section }));
}

export default async function SettingsDetailPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const config = settingsConfigs[section];
  if (!config) notFound();

  return (
    <AppShell>
      <SettingsPageShell title={config.title} subtitle={config.subtitle}>
        <SettingsBody kind={config.kind} />
      </SettingsPageShell>
    </AppShell>
  );
}

function SettingsBody({ kind }: { kind: SettingsConfig["kind"] }) {
  switch (kind) {
    case "account":
      return (
        <div className="space-y-4">
          <SettingsSection label="Private account">
            <ReadonlyRow label="Email" value="eric@example.com" />
            <ReadonlyRow label="Phone number" value="Optional" />
            <ReadonlyRow label="Username" value="@ericbergstrom" />
            <ReadonlyRow label="Date joined" value="June 2026" />
            <ReadonlyRow label="Account status" value="Active" />
            <ReadonlyRow label="Trust level" value="Level 2 - Helpful Member" />
            <ReadonlyRow label="Account type" value="Member" />
          </SettingsSection>
          <Card className="p-4 text-sm leading-6 text-[#6E6E6E]">Email, phone number, and account status never appear on public Passport views.</Card>
        </div>
      );
    case "password":
      return (
        <div className="space-y-4">
          <FormFieldCard label="Current password"><PassportTextInput type="password" placeholder="Current password" /></FormFieldCard>
          <FormFieldCard label="New password"><PassportTextInput type="password" placeholder="New password" /></FormFieldCard>
          <FormFieldCard label="Confirm new password"><PassportTextInput type="password" placeholder="Confirm new password" /></FormFieldCard>
          <Card className="p-4">
            <p className="text-sm font-black text-[#111111]">Password checklist</p>
            <ul className="mt-3 space-y-2 text-sm font-bold text-[#6E6E6E]">
              <li>8 characters</li>
              <li>Uppercase letter</li>
              <li>Number</li>
              <li>Symbol</li>
            </ul>
          </Card>
          <SaveBar label="Update password" />
        </div>
      );
    case "profile-visibility":
      return (
        <RadioList
          name="profile-visibility"
          options={[
            ["Private", "Only you can view your Passport."],
            ["Members Only", "Collective members can view your Passport."],
            ["Feedback Group", "People in your feedback group can view your Passport."],
            ["Public Portfolio", "A limited public view can show proof you choose."]
          ]}
          defaultIndex={1}
        />
      );
    case "proof-visibility":
      return (
        <RadioList
          name="proof-visibility"
          options={[
            ["Private", "Only you can view new proof by default."],
            ["Shared with Feedback Group", "Your feedback group can respond to proof."],
            ["Members Only", "Collective members can view new proof."],
            ["Public on Profile", "Proof can appear on your public Passport when pinned."]
          ]}
          defaultIndex={1}
        />
      );
    case "introduction":
      return (
        <div className="space-y-4">
          <SettingsSection label="Introduction filters">
            <ToggleRow title="Open to Introductions" subtitle="Show a green status dot when enabled." />
            <ToggleRow title="Allow only same direction" subtitle="Limit requests to members practicing a related direction." defaultChecked={false} />
            <ToggleRow title="Allow only trusted members" subtitle="Require a basic trust history before requests." defaultChecked={false} />
          </SettingsSection>
          <FormFieldCard label="What others see"><PassportTextArea defaultValue="Practicing clearer communication through proof." /></FormFieldCard>
          <FormFieldCard label="What you are looking for"><PassportTextArea defaultValue="Useful feedback on tone, clarity, and pacing." /></FormFieldCard>
          <SaveBar />
        </div>
      );
    case "blocked":
      return (
        <div className="space-y-4">
          <FormFieldCard label="Block a user"><PassportTextInput placeholder="Search by username" /></FormFieldCard>
          <Card className="p-4">
            <p className="text-sm font-black text-[#111111]">No blocked users yet</p>
            <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">If you block someone, they cannot view your Passport, send introductions, give feedback, or interact with visible proof.</p>
          </Card>
        </div>
      );
    case "push":
      return <ToggleGroup labels={["Practice Reminders", "Proof Feedback", "Introduction Requests", "Trust Updates", "Contribution Activity", "Achievements", "Product Updates"]} quietHours />;
    case "email":
      return <ToggleGroup labels={["Weekly Progress Summary", "Feedback Digests", "Introduction Requests", "Product Updates", "Important Account Notices", "Marketing Emails"]} />;
    case "feedback-notifications":
      return <ToggleGroup labels={["New Feedback Received", "Feedback Replies", "Helpful Rating Alerts", "Reminders to Apply Feedback", "Feedback Requested on My Proof", "Feedback Loop Completed"]} />;
    case "feedback-preferences":
      return (
        <div className="space-y-4">
          <RadioList name="feedback-style" options={[["Balanced", "Kind, specific, and useful."], ["Direct", "Short and clear."], ["Encouraging", "Extra gentle language for early practice."]]} defaultIndex={0} />
          <Card className="p-4">
            <p className="mb-3 text-sm font-black text-[#111111]">Default focus areas</p>
            <div className="flex flex-wrap gap-2">
              {["Clarity", "Tone", "Pacing", "Examples", "Next step"].map((item) => <PreferenceChip key={item}>{item}</PreferenceChip>)}
            </div>
          </Card>
          <ToggleRow title="Allow anonymous feedback" subtitle="Disabled by default for beginner safety." defaultChecked={false} />
          <SaveBar />
        </div>
      );
    case "content-preferences":
      return (
        <div className="space-y-4">
          <Card className="p-4">
            <p className="mb-3 text-sm font-black text-[#111111]">Show more practice about</p>
            <div className="flex flex-wrap gap-2">
              {["Communication", "Confidence", "Leadership", "Mindset", "Relationships", "Creativity", "Productivity", "Career", "Other"].map((item) => <PreferenceChip key={item}>{item}</PreferenceChip>)}
            </div>
          </Card>
          <SaveBar />
        </div>
      );
    case "theme":
      return <RadioList name="theme" options={[["Light", "Warm cream and gold."], ["Dark", "Prepared for a future low-light theme."], ["System", "Follow your device preference."]]} defaultIndex={0} />;
    case "help":
      return <SimpleList items={["Getting Started", "How Collective Works", "Practice & Proof", "Feedback", "Trust & Community", "Account & Privacy", "FAQ"]} />;
    case "support":
      return (
        <div className="space-y-4">
          <RadioList name="support-kind" options={[["Send a Message", "Ask for help with your account or practice loop."], ["Report a Bug", "Tell us what broke."], ["Feature Request", "Suggest a useful improvement."], ["Safety or Moderation Concern", "Flag a safety issue for review."]]} defaultIndex={0} />
          <FormFieldCard label="Subject"><PassportTextInput placeholder="What do you need help with?" /></FormFieldCard>
          <FormFieldCard label="Message"><PassportTextArea placeholder="Share what happened in plain language." /></FormFieldCard>
          <Button className="w-full">Submit</Button>
        </div>
      );
    case "product-feedback":
      return (
        <div className="space-y-4">
          <RadioList name="product-feedback" options={[["Share an Idea", "A small improvement that would help."], ["Report an Issue", "Something feels broken."], ["What do you love", "A part that feels useful."], ["What feels confusing", "A place where the product needs clearer language."], ["What should we build next", "A future idea grounded in progress."]]} defaultIndex={0} />
          <FormFieldCard label="Feedback"><PassportTextArea placeholder="Tell us what would make Collective more useful." /></FormFieldCard>
          <Button className="w-full">Send product feedback</Button>
        </div>
      );
    case "sign-out":
      return (
        <Card className="p-5 text-center">
          <h2 className="text-xl font-black text-[#111111]">Sign out?</h2>
          <p className="mx-auto mt-2 max-w-[280px] text-sm leading-6 text-[#6E6E6E]">This will leave the current session. Your local prototype progress remains on this device.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button variant="secondary">Cancel</Button>
            <Button className="bg-[#DC2626] shadow-[3px_3px_0_#9F1D1D]">Sign Out</Button>
          </div>
        </Card>
      );
  }
}

function ReadonlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#EFE7D8] px-4 py-3 last:border-b-0">
      <p className="text-sm font-black text-[#111111]">{label}</p>
      <p className="text-right text-sm font-bold text-[#6E6E6E]">{value}</p>
    </div>
  );
}

function RadioList({ name, options, defaultIndex }: { name: string; options: [string, string][]; defaultIndex: number }) {
  return (
    <div className="space-y-3">
      {options.map(([title, body], index) => <RadioOptionCard key={title} name={name} title={title} body={body} defaultChecked={index === defaultIndex} />)}
      <SaveBar />
    </div>
  );
}

function ToggleGroup({ labels, quietHours = false }: { labels: string[]; quietHours?: boolean }) {
  return (
    <div className="space-y-4">
      <SettingsSection label="Toggles">
        {labels.map((label) => <ToggleRow key={label} title={label} />)}
      </SettingsSection>
      {quietHours && (
        <Card className="p-4">
          <p className="text-sm font-black text-[#111111]">Quiet Hours</p>
          <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">Keep reminders out of the way when you are resting.</p>
        </Card>
      )}
      <SaveBar />
    </div>
  );
}

function SimpleList({ items }: { items: string[] }) {
  return (
    <SettingsSection label="Topics">
      {items.map((item) => (
        <div key={item} className="border-b border-[#EFE7D8] px-4 py-4 text-sm font-black text-[#111111] last:border-b-0">
          {item}
        </div>
      ))}
    </SettingsSection>
  );
}
