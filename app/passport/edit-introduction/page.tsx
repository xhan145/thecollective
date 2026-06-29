"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/beta/AppShell";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { Button, Card, PageHeader, SectionLabel } from "@/components/beta/ui";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getProfileDetails, saveProfileDetails } from "@/lib/supabase/passportRepository";

function Field({ label, value, onChange, placeholder, multiline }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-extrabold text-[#9B958B]">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className="w-full resize-none rounded-2xl border border-[#EFE7D8] bg-[#FFFDF8] px-3 py-2.5 text-sm text-[#111111] outline-none focus-visible:ring-2 focus-visible:ring-[#F2A900]/40"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-[#EFE7D8] bg-[#FFFDF8] px-3 py-2.5 text-sm text-[#111111] outline-none focus-visible:ring-2 focus-visible:ring-[#F2A900]/40"
        />
      )}
    </label>
  );
}

export default function EditIntroductionPage() {
  const router = useRouter();
  const { currentUser, updateProfile, supabaseEnabled } = useBetaApp();
  const [headline, setHeadline] = useState("");
  const [focusSkill, setFocusSkill] = useState("");
  const [openToIntro, setOpenToIntro] = useState(true);
  const [hereToPractice, setHereToPractice] = useState("");
  const [workingOn, setWorkingOn] = useState("");
  const [wantsFeedbackOn, setWantsFeedbackOn] = useState("");
  const [canHelpWith, setCanHelpWith] = useState("");
  const [sameDirOnly, setSameDirOnly] = useState(false);
  const [trustedOnly, setTrustedOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setHeadline(currentUser.headline ?? "");
      setFocusSkill(currentUser.currentFocusSkill ?? "");
      setOpenToIntro(currentUser.openToIntroductions ?? true);
    }
    const client = supabaseEnabled ? getSupabaseClient() : null;
    if (!client || !currentUser?.id) return;
    void getProfileDetails(client, currentUser.id).then((d) => {
      if (!d) return;
      setHereToPractice(d.hereToPractice ?? "");
      setWorkingOn(d.currentlyWorkingOn ?? "");
      setWantsFeedbackOn(d.wantsFeedbackOn ?? "");
      setCanHelpWith(d.canHelpWith ?? "");
      setSameDirOnly(d.allowSameDirectionOnly);
      setTrustedOnly(d.allowTrustedOnly);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabaseEnabled, currentUser?.id]);

  async function handleSave() {
    setSaving(true);
    await updateProfile({
      headline: headline.trim() || null,
      currentFocusSkill: focusSkill.trim() || null,
      openToIntroductions: openToIntro,
    });
    const client = supabaseEnabled ? getSupabaseClient() : null;
    if (client && currentUser?.id) {
      await saveProfileDetails(client, currentUser.id, {
        hereToPractice: hereToPractice.trim() || null,
        currentlyWorkingOn: workingOn.trim() || null,
        wantsFeedbackOn: wantsFeedbackOn.trim() || null,
        canHelpWith: canHelpWith.trim() || null,
        allowSameDirectionOnly: sameDirOnly,
        allowTrustedOnly: trustedOnly,
      }).catch(() => {});
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => router.push("/passport"), 600);
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Edit introduction" subtitle="A short, guided intro — not a blank bio." />

        <Card className="space-y-3 p-5">
          <Field label="Headline" value={headline} onChange={setHeadline} placeholder="Practicing clearer communication through proof." />
          <Field label="Current focus skill" value={focusSkill} onChange={setFocusSkill} placeholder="Clear introductions" />
        </Card>

        <SectionLabel title="Your introduction" />
        <Card className="space-y-3 p-5">
          <Field label="I'm here to practice" value={hereToPractice} onChange={setHereToPractice} placeholder="Clearer communication and confidence." multiline />
          <Field label="I'm working on" value={workingOn} onChange={setWorkingOn} placeholder="Speaking slowly and staying calm under feedback." multiline />
          <Field label="I'd like feedback on" value={wantsFeedbackOn} onChange={setWantsFeedbackOn} placeholder="Tone, clarity, and pacing." multiline />
          <Field label="I can help with" value={canHelpWith} onChange={setCanHelpWith} placeholder="Encouragement and beginner-friendly feedback." multiline />
        </Card>

        <SectionLabel title="Introductions" />
        <Card className="space-y-3 p-5">
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-[#38322A]">Open to introductions</span>
            <input type="checkbox" checked={openToIntro} onChange={(e) => setOpenToIntro(e.target.checked)} className="h-5 w-5 accent-[#F2A900]" />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-[#38322A]">Only people in my direction</span>
            <input type="checkbox" checked={sameDirOnly} onChange={(e) => setSameDirOnly(e.target.checked)} className="h-5 w-5 accent-[#F2A900]" />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-[#38322A]">Only trusted members</span>
            <input type="checkbox" checked={trustedOnly} onChange={(e) => setTrustedOnly(e.target.checked)} className="h-5 w-5 accent-[#F2A900]" />
          </label>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saved ? "Saved ✓" : saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </AppShell>
  );
}
