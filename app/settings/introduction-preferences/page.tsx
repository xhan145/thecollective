"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/beta/AppShell";
import { Card, PageHeader } from "@/components/beta/ui";
import { ToggleRow } from "@/components/beta/SettingsKit";
import { useBetaApp } from "@/components/beta/AppStateProvider";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getProfileDetails, saveProfileDetails } from "@/lib/supabase/passportRepository";

export default function IntroductionPreferencesPage() {
  const { currentUser, updateProfile, supabaseEnabled } = useBetaApp();
  const [openToIntro, setOpenToIntro] = useState(true);
  const [sameDirOnly, setSameDirOnly] = useState(false);
  const [trustedOnly, setTrustedOnly] = useState(false);

  useEffect(() => {
    if (currentUser) setOpenToIntro(currentUser.openToIntroductions ?? true);
    const client = supabaseEnabled ? getSupabaseClient() : null;
    if (!client || !currentUser?.id) return;
    void getProfileDetails(client, currentUser.id).then((d) => {
      if (!d) return;
      setSameDirOnly(d.allowSameDirectionOnly);
      setTrustedOnly(d.allowTrustedOnly);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabaseEnabled, currentUser?.id]);

  function setOpen(v: boolean) {
    setOpenToIntro(v);
    void updateProfile({ openToIntroductions: v });
  }

  function persistDetail(next: { sameDir?: boolean; trusted?: boolean }) {
    const client = supabaseEnabled ? getSupabaseClient() : null;
    if (!client || !currentUser?.id) return;
    void saveProfileDetails(client, currentUser.id, {
      allowSameDirectionOnly: next.sameDir ?? sameDirOnly,
      allowTrustedOnly: next.trusted ?? trustedOnly,
    }).catch(() => {});
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader title="Introduction preferences" subtitle="Who can ask to be introduced to you." />
        <Card className="space-y-4 p-5 pixel-card">
          <ToggleRow label="Open to introductions" hint="Show the green indicator on your passport." checked={openToIntro} onChange={setOpen} />
          <ToggleRow
            label="Only people in my direction"
            hint="Limit requests to members practicing what you are."
            checked={sameDirOnly}
            onChange={(v) => {
              setSameDirOnly(v);
              persistDetail({ sameDir: v });
            }}
          />
          <ToggleRow
            label="Only trusted members"
            hint="Limit requests to members who’ve earned trust."
            checked={trustedOnly}
            onChange={(v) => {
              setTrustedOnly(v);
              persistDetail({ trusted: v });
            }}
          />
        </Card>
        <p className="px-1 text-xs leading-5 text-[#9B958B]">
          Others see what you wrote in your introduction. Edit that on your passport.
        </p>
      </div>
    </AppShell>
  );
}
