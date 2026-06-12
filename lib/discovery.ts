import type { ScoutProfile, TrackWithArtist } from "@/lib/types";

function overlapScore(trackTags: string[], scoutTags: string[]): number {
  const scout = new Set(scoutTags.map((tag) => tag.toLowerCase()));
  return trackTags.reduce((score, tag) => score + (scout.has(tag.toLowerCase()) ? 1 : 0), 0);
}

export function rankDiscoveryTracks(
  tracks: TrackWithArtist[],
  scoutProfile: ScoutProfile | null,
): TrackWithArtist[] {
  return [...tracks].sort((a, b) => {
    const aPreference =
      overlapScore(a.genre_tags, scoutProfile?.favorite_genres ?? []) * 4 +
      overlapScore(a.mood_tags, scoutProfile?.favorite_moods ?? []) * 3;
    const bPreference =
      overlapScore(b.genre_tags, scoutProfile?.favorite_genres ?? []) * 4 +
      overlapScore(b.mood_tags, scoutProfile?.favorite_moods ?? []) * 3;

    const aFirst50 = a.discovery_stage === "first_50" && a.stats.unique_listens < 50 ? 10 : 0;
    const bFirst50 = b.discovery_stage === "first_50" && b.stats.unique_listens < 50 ? 10 : 0;
    const aScarcity = Math.max(0, 50 - a.stats.unique_listens) / 10;
    const bScarcity = Math.max(0, 50 - b.stats.unique_listens) / 10;

    return bPreference + bFirst50 + bScarcity - (aPreference + aFirst50 + aScarcity);
  });
}
