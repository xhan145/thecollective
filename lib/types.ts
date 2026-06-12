export type UserRole = "artist" | "scout" | "admin";

export type TrackStatus = "draft" | "pending_review" | "approved" | "rejected";

export type DiscoveryStage = "uploaded" | "first_50" | "first_250" | "rising";

export interface SignalFlowUser {
  id: string;
  email: string | null;
  role: UserRole;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface ArtistProfile {
  id: string;
  user_id: string;
  artist_name: string;
  bio: string | null;
  location: string | null;
  genres: string[];
  links: Record<string, string> | null;
  created_at: string;
}

export interface ScoutProfile {
  id: string;
  user_id: string;
  favorite_genres: string[];
  favorite_moods: string[];
  scout_level: string;
  flowfinder_score: number;
  backed_count: number;
  created_at: string;
}

export interface Track {
  id: string;
  artist_id: string;
  title: string;
  description: string | null;
  genre_tags: string[];
  mood_tags: string[];
  audio_url: string;
  artwork_url: string | null;
  duration_seconds: number | null;
  status: TrackStatus;
  discovery_stage: DiscoveryStage;
  rights_confirmed: boolean;
  rejection_reason: string | null;
  created_at: string;
}

export interface TrackAnalysis {
  id: string;
  track_id: string;
  bpm: number | null;
  key: string | null;
  energy: number;
  mood_summary: string;
  genre_summary: string;
  sonic_description: string;
  similar_currents: string[];
  strongest_moment: string;
  mix_notes: string;
  promo_angle: string;
  created_at: string;
}

export interface ListenEvent {
  id: string;
  track_id: string;
  user_id: string;
  seconds_played: number;
  completed: boolean;
  skipped: boolean;
  saved: boolean;
  backed: boolean;
  commented: boolean;
  created_at: string;
}

export interface Save {
  id: string;
  user_id: string;
  track_id: string;
  created_at: string;
}

export interface Back {
  id: string;
  user_id: string;
  track_id: string;
  artist_id: string;
  listener_number: number;
  artist_followers_at_backing: number;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  track_id: string;
  body: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: string;
  created_at: string;
}

export interface RecommendationBatch {
  id: string;
  track_id: string;
  user_id: string;
  reason: string | null;
  shown: boolean;
  created_at: string;
}

export interface TrackStats {
  unique_listens: number;
  saves: number;
  backs: number;
  skips: number;
  completion_rate: number;
}

export interface TrackWithArtist extends Track {
  artist: ArtistProfile | null;
  analysis: TrackAnalysis | null;
  stats: TrackStats;
  saved_by_viewer?: boolean;
  backed_by_viewer?: Back | null;
}

export interface BackWithTrack extends Back {
  track: TrackWithArtist;
}

export interface SignalprintInput {
  title: string;
  genre_tags: string[];
  mood_tags: string[];
  description?: string | null;
}

export type SignalprintDraft = Omit<TrackAnalysis, "id" | "track_id" | "created_at">;

export interface ActionState {
  error: string | null;
  message?: string;
}

// Compatibility types kept so dormant inherited components still compile.
export type TrustStage = "starting" | "building" | "trusted" | "contributor";
export type ProofType = "text" | "image" | "video" | "audio" | "link";
export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  current_direction_id: string | null;
  trust_stage: TrustStage;
  created_at: string;
  updated_at: string;
}
export interface Direction {
  id: string;
  slug: string;
  title: string;
  description: string;
  promise: string;
  is_active: boolean;
  created_at: string;
}
export interface Practice {
  id: string;
  direction_id: string;
  title: string;
  prompt: string;
  steps: string[];
  estimated_minutes: number;
  proof_suggestion: string | null;
  is_active: boolean;
  created_at: string;
}
export interface Proof {
  id: string;
  user_id: string;
  practice_id: string | null;
  practice_log_id: string | null;
  title: string;
  body: string;
  feedback_request: string | null;
  proof_type: ProofType;
  media_url: string | null;
  media_path: string | null;
  link_url: string | null;
  visibility: "closed_beta" | "private";
  status: string;
  created_at: string;
  updated_at: string;
}
export interface Feedback {
  id: string;
  proof_id: string;
  giver_id: string;
  receiver_id: string;
  what_worked: string;
  could_be_clearer: string | null;
  next_step: string | null;
  encouragement: string | null;
  is_marked_helpful: boolean;
  created_at: string;
}
export type TrustEventType =
  | "practice_completed"
  | "proof_submitted"
  | "feedback_given"
  | "feedback_marked_helpful"
  | "practice_remixed_from_proof"
  | "beta_feedback_submitted";
export interface ProofWithMeta extends Proof {
  author_name: string | null;
  practice_title: string | null;
  feedback_count: number;
}
