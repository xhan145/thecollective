import type { SignalprintDraft, SignalprintInput } from "@/lib/types";

const GENRE_TEXTURES: Record<string, string> = {
  ambient: "wide atmospheric drift",
  bass: "cinematic low-end pressure",
  club: "late-night club motion",
  electronic: "synthetic pulse design",
  "experimental trap": "fractured trap percussion",
  grime: "gritty pressure and clipped vocal space",
  hyperpop: "glossy maximalist charge",
  indie: "handmade melodic intimacy",
  jungle: "breakbeat velocity",
  rap: "direct vocal gravity",
  techno: "warehouse-grade repetition",
};

const MOOD_TEXTURES: Record<string, string> = {
  dark: "nocturnal mood",
  euphoric: "bright lift",
  gritty: "raw edge",
  haunted: "ghosted negative space",
  hypnotic: "looped trance pull",
  lonely: "isolated after-hours glow",
  romantic: "warm close-range emotion",
  volatile: "unstable release energy",
};

function normalizeTags(tags: string[]): string[] {
  return tags
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);
}

function pickTexture(tags: string[], lookup: Record<string, string>, fallback: string) {
  const match = tags.map((tag) => lookup[tag]).find(Boolean);
  return match ?? fallback;
}

function estimateEnergy(genres: string[], moods: string[]): number {
  const high = ["bass", "club", "experimental trap", "grime", "hyperpop", "jungle", "techno", "volatile"];
  const low = ["ambient", "lonely", "haunted"];
  const score = [...genres, ...moods].reduce((total, tag) => {
    if (high.includes(tag)) return total + 10;
    if (low.includes(tag)) return total - 8;
    return total + 2;
  }, 62);
  return Math.max(28, Math.min(94, score));
}

export function parseTags(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function generateMockSignalprint(input: SignalprintInput): SignalprintDraft {
  const genres = normalizeTags(input.genre_tags);
  const moods = normalizeTags(input.mood_tags);
  const primaryGenre = genres[0] ?? "underground electronic";
  const primaryMood = moods[0] ?? "focused";
  const genreTexture = pickTexture(genres, GENRE_TEXTURES, "left-field underground shape");
  const moodTexture = pickTexture(moods, MOOD_TEXTURES, "charged late-night mood");
  const energy = estimateEnergy(genres, moods);
  const bpm = genres.includes("ambient") ? 92 : genres.includes("jungle") ? 166 : 128;
  const key = moods.includes("dark") || moods.includes("haunted") ? "F minor" : "A minor";

  return {
    bpm,
    key,
    energy,
    mood_summary: `${primaryMood} energy with ${moodTexture}, tuned for Scouts who listen past the first obvious hook.`,
    genre_summary: `${primaryGenre} signal shaped by ${genres.length > 1 ? genres.slice(1).join(", ") : "underground crossover instincts"}.`,
    sonic_description: `${genreTexture} with ${moodTexture}, a clean foreground idea, and enough negative space for the track to feel discovered rather than announced.`,
    similar_currents: [
      `${primaryMood} ${primaryGenre} basements`,
      "No Clout Mode discovery queues",
      "first-wave underground club clips",
    ],
    strongest_moment:
      "The Mekhane Engine flags the first major switch as the strongest moment: the section where texture, rhythm, and intent snap into one signal.",
    mix_notes:
      energy > 78
        ? "The low end carries impact well. Keep the transient edge controlled so the drop stays heavy without crowding the vocal or lead motif."
        : "The atmosphere is doing useful work. Bring the lead motif forward by a shade so mobile listeners catch the identity sooner.",
    promo_angle: `Position "${input.title}" as a Hidden Signal for Scouts who want ${primaryMood} ${primaryGenre} before the wider current finds it.`,
  };
}
