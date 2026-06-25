import type { SupabaseClient } from "@supabase/supabase-js";
import type { PracticeTip } from "@/lib/tips/types";

export function mapTip(row: any): PracticeTip {
  return { id: row.id, promptId: row.prompt_id, authorId: row.author_id, body: row.body, isDemo: !!row.is_demo, createdAt: row.created_at };
}

export async function listTips(client: SupabaseClient, promptId: string, viewerId?: string): Promise<PracticeTip[]> {
  let q = client.from("practice_tips").select("*").eq("prompt_id", promptId);
  q = viewerId ? q.or(`held.eq.false,author_id.eq.${viewerId}`) : q.eq("held", false);
  const { data } = await q.order("created_at", { ascending: false });
  return (data ?? []).map(mapTip);
}
