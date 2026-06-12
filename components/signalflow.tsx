import Link from "next/link";
import type { ReactNode } from "react";
import { Activity, BarChart3, Disc3, Flame, Headphones, Radio, Sparkles, Zap } from "lucide-react";
import { SignalFlowLogo } from "@/components/SignalFlowLogo";
import { SignalFlowCard, StatusBadge, Tag } from "@/components/ui";
import type { Back, ScoutProfile, TrackAnalysis, TrackStats, TrackWithArtist } from "@/lib/types";

export function ArtworkBlock({
  track,
  className = "",
}: {
  track: TrackWithArtist;
  className?: string;
}) {
  if (track.artwork_url) {
    return (
      <img
        src={track.artwork_url}
        alt={`${track.title} artwork`}
        className={`aspect-square w-full rounded-card border border-line object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className={`aspect-square w-full rounded-card border border-line bg-cardHi p-6 ${className}`}
    >
      <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
        <SignalFlowLogo size={78} />
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-signal">
            Hidden Signal
          </p>
          <p className="mt-2 text-xl font-black text-ink">{track.title}</p>
        </div>
      </div>
    </div>
  );
}

export function First50Progress({
  count,
  compact = false,
}: {
  count: number;
  compact?: boolean;
}) {
  const clamped = Math.min(50, Math.max(0, count));
  const percent = (clamped / 50) * 100;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-bold text-muted">
        <span>First 50 in progress.</span>
        <span className="text-signal">{clamped} / 50</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-soft">
        <div className="h-full rounded-full bg-signal" style={{ width: `${percent}%` }} />
      </div>
      {!compact && count >= 50 ? (
        <p className="mt-2 text-xs text-muted">
          Summary ready. Graduation logic to First 250 is planned next.
        </p>
      ) : null}
    </div>
  );
}

export function TrackBadges({ track }: { track: TrackWithArtist }) {
  const badges = [
    track.stats.unique_listens < 20 ? "Hidden Signal" : null,
    track.stats.unique_listens >= 20 ? "Early Current" : null,
    track.discovery_stage === "first_50" ? "First 50" : null,
  ].filter(Boolean);
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <span
          key={badge}
          className="rounded-full border border-signal/30 bg-signal/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-signal"
        >
          {badge}
        </span>
      ))}
    </div>
  );
}

export function TrackCard({
  track,
  href,
  compact = false,
}: {
  track: TrackWithArtist;
  href?: string;
  compact?: boolean;
}) {
  const content = (
    <SignalFlowCard className="overflow-hidden p-0">
      <div className="grid grid-cols-[92px_1fr] gap-3 p-3">
        <ArtworkBlock track={track} className="rounded-card" />
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-base font-black text-ink">{track.title}</p>
              <p className="truncate text-sm text-muted">
                {track.artist?.artist_name ?? "Unknown artist"}
              </p>
            </div>
            <StatusBadge status={track.status} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[...track.genre_tags, ...track.mood_tags].slice(0, 4).map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
          {!compact ? (
            <div className="mt-3">
              <First50Progress count={track.stats.unique_listens} compact />
            </div>
          ) : null}
        </div>
      </div>
    </SignalFlowCard>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export function SignalprintReport({ analysis }: { analysis: TrackAnalysis | null }) {
  if (!analysis) {
    return (
      <SignalFlowCard>
        <p className="text-sm font-black text-ink">Signalprint pending.</p>
        <p className="mt-1 text-sm text-muted">The Mekhane Engine has not generated this report yet.</p>
      </SignalFlowCard>
    );
  }
  return (
    <SignalFlowCard className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-signal" />
        <div>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-signal">
            Signalprint
          </p>
          <p className="text-xs text-muted">Powered by the Mekhane Engine</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-ink">{analysis.sonic_description}</p>
      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="Energy" value={`${analysis.energy}`} />
        <MiniStat label="BPM" value={analysis.bpm ? `${analysis.bpm}` : "TBD"} />
        <MiniStat label="Key" value={analysis.key ?? "TBD"} />
      </div>
      <ReportLine label="Mood" body={analysis.mood_summary} />
      <ReportLine label="Genre" body={analysis.genre_summary} />
      <ReportLine label="Strongest moment" body={analysis.strongest_moment} />
      <ReportLine label="Mix notes" body={analysis.mix_notes} />
      <ReportLine label="Promo angle" body={analysis.promo_angle} />
      <div className="flex flex-wrap gap-2">
        {analysis.similar_currents.map((current) => (
          <Tag key={current}>{current}</Tag>
        ))}
      </div>
    </SignalFlowCard>
  );
}

function ReportLine({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink">{body}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-line bg-night/50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 text-lg font-black text-ink">{value}</p>
    </div>
  );
}

export function ArtistDashboardStats({
  tracks,
}: {
  tracks: TrackWithArtist[];
}) {
  const approved = tracks.filter((track) => track.status === "approved").length;
  const pending = tracks.filter((track) => track.status === "pending_review").length;
  const uniqueListens = tracks.reduce((sum, track) => sum + track.stats.unique_listens, 0);
  const backs = tracks.reduce((sum, track) => sum + track.stats.backs, 0);
  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricCard icon={<Radio size={18} />} label="Approved" value={approved} />
      <MetricCard icon={<Activity size={18} />} label="Pending" value={pending} />
      <MetricCard icon={<Headphones size={18} />} label="Listeners" value={uniqueListens} />
      <MetricCard icon={<Zap size={18} />} label="Backs" value={backs} />
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <SignalFlowCard>
      <div className="mb-2 text-signal">{icon}</div>
      <p className="text-2xl font-black text-ink">{value}</p>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
    </SignalFlowCard>
  );
}

export function ScoutProfileCard({ profile }: { profile: ScoutProfile | null }) {
  return (
    <SignalFlowCard>
      <div className="flex items-center gap-3">
        <div className="grid h-14 w-14 place-items-center rounded-full border border-signal/30 bg-signal/10 text-signal">
          <Zap size={25} />
        </div>
        <div>
          <p className="text-xl font-black text-ink">{profile?.scout_level ?? "Flowfinder"}</p>
          <p className="text-sm text-muted">No clout. Just flow.</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniStat label="Flowfinder score" value={`${profile?.flowfinder_score ?? 0}`} />
        <MiniStat label="Backed" value={`${profile?.backed_count ?? 0}`} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {[...(profile?.favorite_genres ?? []), ...(profile?.favorite_moods ?? [])].map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>
    </SignalFlowCard>
  );
}

export function BackingReceipt({
  track,
  back,
  listenerNumber,
}: {
  track: TrackWithArtist;
  back?: Back | null;
  listenerNumber?: number | null;
}) {
  const number = listenerNumber ?? back?.listener_number ?? track.backed_by_viewer?.listener_number;
  if (!number) return null;
  return (
    <SignalFlowCard className="border-signal/30 bg-signal/10">
      <div className="flex items-start gap-3">
        <Flame size={22} className="mt-0.5 text-signal" />
        <div>
          <p className="text-lg font-black text-ink">You are listener #{number}.</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Your co-sign is saved forever. You backed {track.artist?.artist_name ?? "this artist"} before they broke.
          </p>
        </div>
      </div>
    </SignalFlowCard>
  );
}

export function AdminSummary({ pending, reports }: { pending: number; reports: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricCard icon={<Disc3 size={18} />} label="Pending tracks" value={pending} />
      <MetricCard icon={<BarChart3 size={18} />} label="Open reports" value={reports} />
    </div>
  );
}
