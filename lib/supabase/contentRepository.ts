"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Direction, PracticePrompt } from "@/lib/betaTypes";
import { seedDirections, seedPrompts } from "@/lib/betaData";

export interface CollectiveContent {
  directions: Direction[];
  prompts: PracticePrompt[];
}

function mapPractice(row: any): PracticePrompt {
  return {
    id: row.id,
    directionId: row.direction_id,
    title: row.title,
    description: row.description ?? "",
    prompt: row.instructions ?? row.description ?? "",
    type: "proof",
    estimatedMinutes: row.estimated_minutes ?? 5,
    beginnerSafe: true,
    instructions: row.instructions ?? undefined,
    proofPrompt: row.proof_prompt ?? undefined,
  };
}

/**
 * Load directions + practices from Supabase. Falls back to the in-app seed
 * (lib/betaData) if the tables are empty or unreachable, so the app always
 * has content even before migration 013 is run.
 */
export async function loadContent(client: SupabaseClient): Promise<CollectiveContent> {
  try {
    const [dirRes, pracRes] = await Promise.all([
      client.from("directions").select("*").eq("is_active", true).order("sort_order"),
      client.from("practices").select("*").eq("is_active", true).order("sort_order"),
    ]);
    const dirRows = dirRes.data ?? [];
    const pracRows = pracRes.data ?? [];
    if (dirRes.error || pracRes.error || dirRows.length === 0) {
      return { directions: seedDirections, prompts: seedPrompts };
    }

    const prompts = pracRows.map(mapPractice);
    const promptIdsByDirection = new Map<string, string[]>();
    for (const p of prompts) {
      const list = promptIdsByDirection.get(p.directionId) ?? [];
      list.push(p.id);
      promptIdsByDirection.set(p.directionId, list);
    }
    const directions: Direction[] = dirRows.map((row: any) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      subtitle: row.beginner_safe_prompt ?? row.description ?? "",
      description: row.description ?? "",
      promptIds: promptIdsByDirection.get(row.id) ?? [],
      beginnerSafePrompt: row.beginner_safe_prompt ?? undefined,
    }));

    return { directions, prompts };
  } catch {
    return { directions: seedDirections, prompts: seedPrompts };
  }
}
