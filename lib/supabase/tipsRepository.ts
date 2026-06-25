import type { SupabaseClient } from "@supabase/supabase-js";
import type { PracticeTip } from "@/lib/tips/types";

export function mapTip(row: any): PracticeTip {
  return { id: row.id, promptId: row.prompt_id, authorId: row.author_id, body: row.body, isDemo: !!row.is_demo, createdAt: row.created_at };
}

export async function listTips(client: SupabaseClient, promptId: string): Promise<PracticeTip[]> {
  const { data } = await client.from("practice_tips").select("*").eq("prompt_id", promptId).order("created_at", { ascending: false });
  return (data ?? []).map(mapTip);
}
