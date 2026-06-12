import { generateMockSignalprint } from "@/lib/mekhane";
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
} from "@/lib/types";

const createdAt = "2026-06-11T12:00:00.000Z";

export const DEMO_AUDIO_URL =
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

export const demoUsers: Record<"artist" | "scout" | "admin", SignalFlowUser> = {
  artist: {
    id: "00000000-0000-4000-8000-000000000101",
    email: "artist@signalflow.demo",
    role: "artist",
    display_name: "Nyx Relay",
    avatar_url: null,
    created_at: createdAt,
  },
  scout: {
    id: "00000000-0000-4000-8000-000000000201",
    email: "scout@signalflow.demo",
    role: "scout",
    display_name: "Flowfinder 23",
    avatar_url: null,
    created_at: createdAt,
  },
  admin: {
    id: "00000000-0000-4000-8000-000000000301",
    email: "admin@signalflow.demo",
    role: "admin",
    display_name: "S//F Admin",
    avatar_url: null,
    created_at: createdAt,
  },
};

export const demoArtistProfiles: ArtistProfile[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    user_id: demoUsers.artist.id,
    artist_name: "Nyx Relay",
    bio: "Basement electronics, pressure systems, and nocturnal hooks.",
    location: "Detroit, MI",
    genres: ["bass", "experimental trap", "electronic"],
    links: { soundcloud: "https://soundcloud.com/demo" },
    created_at: createdAt,
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    user_id: "00000000-0000-4000-8000-000000000102",
    artist_name: "Glass Teeth",
    bio: "Haunted club sketches with a pop nerve.",
    location: "Baltimore, MD",
    genres: ["hyperpop", "club"],
    links: null,
    created_at: createdAt,
  },
];

export const demoScoutProfile: ScoutProfile = {
  id: "20000000-0000-4000-8000-000000000001",
  user_id: demoUsers.scout.id,
  favorite_genres: ["bass", "experimental trap", "club"],
  favorite_moods: ["dark", "gritty", "hypnotic"],
  scout_level: "Flowfinder",
  flowfinder_score: 138,
  backed_count: 7,
  created_at: createdAt,
};

const rawTracks: Track[] = [
  {
    id: "30000000-0000-4000-8000-000000000001",
    artist_id: demoArtistProfiles[0].id,
    title: "Substation Halo",
    description:
      "Dark cyberpunk bass with a metallic hook and a pressure-drop second half.",
    genre_tags: ["bass", "experimental trap", "electronic"],
    mood_tags: ["dark", "gritty", "hypnotic"],
    audio_url: DEMO_AUDIO_URL,
    artwork_url: null,
    duration_seconds: 198,
    status: "approved",
    discovery_stage: "first_50",
    rights_confirmed: true,
    rejection_reason: null,
    created_at: createdAt,
  },
  {
    id: "30000000-0000-4000-8000-000000000002",
    artist_id: demoArtistProfiles[1].id,
    title: "Velvet Circuit",
    description: "A glossy high-voltage chorus folded into a basement club loop.",
    genre_tags: ["hyperpop", "club", "electronic"],
    mood_tags: ["euphoric", "volatile"],
    audio_url: DEMO_AUDIO_URL,
    artwork_url: null,
    duration_seconds: 176,
    status: "approved",
    discovery_stage: "first_50",
    rights_confirmed: true,
    rejection_reason: null,
    created_at: createdAt,
  },
  {
    id: "30000000-0000-4000-8000-000000000003",
    artist_id: demoArtistProfiles[0].id,
    title: "Low Orbit Witness",
    description: "A draft signal waiting for admin review.",
    genre_tags: ["ambient", "bass"],
    mood_tags: ["haunted", "lonely"],
    audio_url: DEMO_AUDIO_URL,
    artwork_url: null,
    duration_seconds: 221,
    status: "pending_review",
    discovery_stage: "uploaded",
    rights_confirmed: true,
    rejection_reason: null,
    created_at: createdAt,
  },
];

const analyses: TrackAnalysis[] = rawTracks.map((track, index) => ({
  id: `40000000-0000-4000-8000-00000000000${index + 1}`,
  track_id: track.id,
  created_at: createdAt,
  ...generateMockSignalprint(track),
}));

export const demoStats: Record<string, TrackStats> = {
  [rawTracks[0].id]: {
    unique_listens: 23,
    saves: 11,
    backs: 6,
    skips: 4,
    completion_rate: 0.61,
  },
  [rawTracks[1].id]: {
    unique_listens: 41,
    saves: 18,
    backs: 9,
    skips: 7,
    completion_rate: 0.68,
  },
  [rawTracks[2].id]: {
    unique_listens: 0,
    saves: 0,
    backs: 0,
    skips: 0,
    completion_rate: 0,
  },
};

export const demoBacks: Back[] = [
  {
    id: "50000000-0000-4000-8000-000000000001",
    user_id: demoUsers.scout.id,
    track_id: rawTracks[0].id,
    artist_id: rawTracks[0].artist_id,
    listener_number: 23,
    artist_followers_at_backing: 0,
    created_at: createdAt,
  },
];

export const demoReports: Report[] = [
  {
    id: "60000000-0000-4000-8000-000000000001",
    reporter_id: demoUsers.scout.id,
    target_type: "track",
    target_id: rawTracks[1].id,
    reason: "Demo moderation queue item.",
    status: "open",
    created_at: createdAt,
  },
];

export function toTrackWithArtist(track: Track): TrackWithArtist {
  return {
    ...track,
    artist: demoArtistProfiles.find((artist) => artist.id === track.artist_id) ?? null,
    analysis: analyses.find((analysis) => analysis.track_id === track.id) ?? null,
    stats: demoStats[track.id] ?? {
      unique_listens: 0,
      saves: 0,
      backs: 0,
      skips: 0,
      completion_rate: 0,
    },
    backed_by_viewer:
      demoBacks.find((back) => back.track_id === track.id && back.user_id === demoUsers.scout.id) ??
      null,
    saved_by_viewer: track.id === rawTracks[1].id,
  };
}

export const demoTracks: TrackWithArtist[] = rawTracks.map(toTrackWithArtist);

export function getDemoTrack(trackId: string): TrackWithArtist | null {
  return demoTracks.find((track) => track.id === trackId) ?? null;
}

export function getDemoArtistTracks(artistId = demoArtistProfiles[0].id): TrackWithArtist[] {
  return demoTracks.filter((track) => track.artist_id === artistId);
}
