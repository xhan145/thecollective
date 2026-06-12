import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { UploadTrackForm } from "@/components/signalflow-client";
import { SecondaryButton } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function ArtistUploadPage() {
  return (
    <AppShell active="upload">
      <div className="mb-6">
        <Link href="/artist/dashboard" className="text-sm font-bold text-muted">
          Back to dashboard
        </Link>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-signal">
          Upload
        </p>
        <h1 className="mt-1 text-3xl font-black text-ink">Enter the Flow.</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Confirm rights, add tags, and generate a mock Mekhane Engine Signalprint for admin review.
        </p>
      </div>
      <UploadTrackForm />
      <div className="mt-4">
        <SecondaryButton href="/artist/onboarding">Edit artist profile</SecondaryButton>
      </div>
    </AppShell>
  );
}
