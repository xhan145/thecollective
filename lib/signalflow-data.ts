import { redirect } from "next/navigation";
import { demoArtistProfiles, demoBacks, demoReports, demoScoutProfile, demoTracks, demoUsers, getDemoArtistTracks, getDemoTrack } from "@/lib/demoData";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  ArtistProfile,
  Back,
  Report,
  ScoutProfile,
  SignalFlowUser,
  Track,
  TrackAnalysis,
  TrackStats,
  TrackWithArtist,
  UserRole,
} from "@/lib/types";

type TrackRow = Track & {
  artist_profiles?: ArtistProfile | ArtistProfile[] | null;
  track_analysis?: TrackAnalysis | TrackAnalysis[] | null;
};

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function isDemoMode(): boolean {
  return !isSupabaseConfigured();
}

export async function getSessionUserRecord(roleHint: UserRole = "scout"): Promise<SignalFlowUser | null> {
  if (isDemoMode()) return demoUsers[roleHint];
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return existing as SignalFlowUser;

  const { data } = await supabase
    .from("users")
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        role: roleHint,
        display_name: user.email?.split("@")[0] ?? "Flowfinder",
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();
  return (data as SignalFlowUser) ?? null;
}

export async function requireSessionUser(roleHint: UserRole = "scout"): Promise<SignalFlowUser> {
  const user = await getSessionUserRecord(roleHint);
  if (!user) redirect("/auth?mode=signin");
  return user;
}

export async function getArtistProfile(userId: string): Promise<ArtistProfile | null> {
  if (isDemoMode()) {
    return demoArtistProfiles.find((artist) => artist.user_id === userId) ?? demoArtistProfiles[0];
  }
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("artist_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as ArtistProfile) ?? null;
}

export async function getScoutProfile(userId: string): Promise<ScoutProfile | null> {
  if (isDemoMode()) return demoScoutProfile;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("scout_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as ScoutProfile) ?? null;
}

export function createEmptyStats(): TrackStats {
  return {
    unique_listens: 0,
    saves: 0,
    backs: 0,
    skips: 0,
    completion_rate: 0,
  };
}

export async function getTrackStats(trackId: string): Promise<TrackStats> {
  if (isDemoMode()) return getDemoTrack(trackId)?.stats ?? createEmptyStats();
  const supabase = await createServerSupabase();
  const [listenRes, savesRes, backsRes] = await Promise.all([
    supabase
      .from("listen_events")
      .select("user_id, completed, skipped")
      .eq("track_id", trackId),
    supabase
      .from("saves")
      .select("id", { count: "exact", head: true })
      .eq("track_id", trackId),
    supabase
      .from("backs")
      .select("id", { count: "exact", head: true })
      .eq("track_id", trackId),
  ]);

  const listens = listenRes.data ?? [];
  const unique = new Set(listens.map((event) => event.user_id)).size;
  const completed = listens.filter((event) => event.completed).length;
  return {
    unique_listens: unique,
    saves: savesRes.count ?? 0,
    backs: backsRes.count ?? 0,
    skips: listens.filter((event) => event.skipped).length,
    completion_rate: listens.length > 0 ? completed / listens.length : 0,
  };
}

export async function hydrateTrack(track: TrackRow, viewerId?: string | null): Promise<TrackWithArtist> {
  const stats = await getTrackStats(track.id);
  let savedByViewer = false;
  let backedByViewer: Back | null = null;

  if (viewerId && !isDemoMode()) {
    const supabase = await createServerSupabase();
    const [saveRes, backRes] = await Promise.all([
      supabase
        .from("saves")
        .select("id")
        .eq("track_id", track.id)
        .eq("user_id", viewerId)
        .maybeSingle(),
      supabase
        .from("backs")
        .select("*")
        .eq("track_id", track.id)
        .eq("user_id", viewerId)
        .maybeSingle(),
    ]);
    savedByViewer = Boolean(saveRes.data);
    backedByViewer = (backRes.data as Back) ?? null;
  }

  return {
    ...track,
    artist: first(track.artist_profiles),
    analysis: first(track.track_analysis),
    stats,
    saved_by_viewer: savedByViewer,
    backed_by_viewer: backedByViewer,
  };
}

export async function getApprovedDiscoveryTracks(viewerId?: string | null): Promise<TrackWithArtist[]> {
  if (isDemoMode()) return demoTracks.filter((track) => track.status === "approved");
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("tracks")
    .select("*, artist_profiles(*), track_analysis(*)")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(30);
  const rows = ((data ?? []) as TrackRow[]).filter((track) => Boolean(track.audio_url));
  return Promise.all(rows.map((track) => hydrateTrack(track, viewerId)));
}

export async function getArtistTracks(artistId: string): Promise<TrackWithArtist[]> {
  if (isDemoMode()) return getDemoArtistTracks(artistId);
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("tracks")
    .select("*, artist_profiles(*), track_analysis(*)")
    .eq("artist_id", artistId)
    .order("created_at", { ascending: false });
  return Promise.all(((data ?? []) as TrackRow[]).map((track) => hydrateTrack(track)));
}

export async function getTrackById(trackId: string, viewerId?: string | null): Promise<TrackWithArtist | null> {
  if (isDemoMode()) return getDemoTrack(trackId);
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("tracks")
    .select("*, artist_profiles(*), track_analysis(*)")
    .eq("id", trackId)
    .maybeSingle();
  return data ? hydrateTrack(data as TrackRow, viewerId) : null;
}

export async function getPendingTracks(): Promise<TrackWithArtist[]> {
  if (isDemoMode()) return demoTracks.filter((track) => track.status === "pending_review");
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("tracks")
    .select("*, artist_profiles(*), track_analysis(*)")
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });
  return Promise.all(((data ?? []) as TrackRow[]).map((track) => hydrateTrack(track)));
}

export async function getReports(): Promise<Report[]> {
  if (isDemoMode()) return demoReports;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Report[];
}

export async function getBackedTracks(userId: string): Promise<Array<Back & { track: TrackWithArtist }>> {
  if (isDemoMode()) {
    return demoBacks.map((back) => ({
      ...back,
      track: getDemoTrack(back.track_id) ?? demoTracks[0],
    }));
  }
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("backs")
    .select("*, tracks(*, artist_profiles(*), track_analysis(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as Array<Back & { tracks: TrackRow }>;
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      track: await hydrateTrack(row.tracks, userId),
    })),
  );
}

export async function getSavedTracks(userId: string): Promise<TrackWithArtist[]> {
  if (isDemoMode()) return demoTracks.filter((track) => track.saved_by_viewer);
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("saves")
    .select("tracks(*, artist_profiles(*), track_analysis(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Array<{ tracks: TrackRow | TrackRow[] | null }>;
  return Promise.all(
    rows
      .map((row) => first(row.tracks))
      .filter((track): track is TrackRow => Boolean(track))
      .map((track) => hydrateTrack(track, userId)),
  );
}
