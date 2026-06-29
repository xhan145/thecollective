import { notFound } from "next/navigation";
import { AppShell } from "@/components/beta/AppShell";
import { Button, Card } from "@/components/beta/ui";
import {
  BadgeRow,
  FormFieldCard,
  PassportTextArea,
  PassportTextInput,
  PinnedProofCard,
  SaveBar,
  SettingsPageShell
} from "@/components/passport/PassportComponents";
import { samplePassportProfile } from "@/lib/passportData";

const passportSections = {
  edit: {
    title: "Edit Profile",
    subtitle: "Update the profile details people expect inside account settings."
  },
  "edit-introduction": {
    title: "Edit Introduction",
    subtitle: "Keep the introduction guided so it stays about practice, proof, and useful feedback."
  },
  badges: {
    title: "Displayed Badges",
    subtitle: "Choose calm earned signals to show on your Passport."
  },
  "pinned-proofs": {
    title: "Pinned Proofs",
    subtitle: "Pin proof that helps others understand your progress."
  },
  share: {
    title: "Share Passport",
    subtitle: "Share only the view allowed by your visibility settings."
  }
} as const;

export function generateStaticParams() {
  return Object.keys(passportSections).map((section) => ({ section }));
}

export default async function PassportSubPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const config = passportSections[section as keyof typeof passportSections];
  if (!config) notFound();
  const profile = samplePassportProfile;

  return (
    <AppShell>
      <SettingsPageShell title={config.title} subtitle={config.subtitle}>
        {section === "edit" && (
          <div className="space-y-4">
            <FormFieldCard label="Profile Photo">
              <div className="flex items-center gap-3">
                <div className="grid h-16 w-16 place-items-center rounded-[22px] border-4 border-[#FFF1C7] bg-[#F2A900] text-2xl font-black text-white">E</div>
                <Button type="button" variant="secondary">Change photo</Button>
              </div>
            </FormFieldCard>
            <FormFieldCard label="Display Name"><PassportTextInput defaultValue={profile.displayName} /></FormFieldCard>
            <FormFieldCard label="Username"><PassportTextInput defaultValue={profile.username} /></FormFieldCard>
            <FormFieldCard label="Headline"><PassportTextInput defaultValue={profile.headline} /></FormFieldCard>
            <FormFieldCard label="Current Direction"><PassportTextInput defaultValue={profile.currentDirection} /></FormFieldCard>
            <FormFieldCard label="Current Focus Skill"><PassportTextInput defaultValue={profile.currentFocusSkill} /></FormFieldCard>
            <FormFieldCard label="Introduction Summary"><PassportTextArea defaultValue={profile.intro.hereToPractice} /></FormFieldCard>
            <FormFieldCard label="Location (optional)"><PassportTextInput placeholder="City or region" /></FormFieldCard>
            <FormFieldCard label="Website (optional)"><PassportTextInput placeholder="https://" /></FormFieldCard>
            <SaveBar />
          </div>
        )}
        {section === "edit-introduction" && (
          <div className="space-y-4">
            <FormFieldCard label="I'm here to practice"><PassportTextArea defaultValue={profile.intro.hereToPractice} /></FormFieldCard>
            <FormFieldCard label="I'm working on"><PassportTextArea defaultValue={profile.intro.currentlyWorkingOn} /></FormFieldCard>
            <FormFieldCard label="I'd like feedback on"><PassportTextArea defaultValue={profile.intro.wantsFeedbackOn} /></FormFieldCard>
            <FormFieldCard label="I can help with"><PassportTextArea defaultValue={profile.intro.canHelpWith} /></FormFieldCard>
            <SaveBar />
          </div>
        )}
        {section === "badges" && (
          <div className="space-y-4">
            <BadgeRow badges={profile.badges} />
            <Card className="p-4 text-sm leading-6 text-[#6E6E6E]">Badges are earned through practice, proof, useful feedback, and contribution. They are not popularity markers.</Card>
            <SaveBar label="Save displayed badges" />
          </div>
        )}
        {section === "pinned-proofs" && (
          <div className="space-y-4">
            {profile.pinnedProofs.map((proof) => <PinnedProofCard key={proof.title} proof={proof} />)}
            <Card className="p-4 text-sm leading-6 text-[#6E6E6E]">Pinned proof should answer what you practiced, what changed, and how feedback helped.</Card>
            <SaveBar label="Save pinned proofs" />
          </div>
        )}
        {section === "share" && (
          <Card className="p-5">
            <h2 className="text-xl font-black text-[#111111]">Share profile link</h2>
            <p className="mt-2 text-sm leading-6 text-[#6E6E6E]">This prototype prepares a profile link, but your Passport visibility rules still decide what another person can see.</p>
            <div className="mt-4 rounded-[18px] border border-[#EFE7D8] bg-[#FFF8EE] p-4 text-sm font-black text-[#111111]">
              collective.app/passport/{profile.username}
            </div>
            <Button className="mt-4 w-full">Copy link</Button>
          </Card>
        )}
      </SettingsPageShell>
    </AppShell>
  );
}
