import type { SupabaseClient } from "@supabase/supabase-js";

// Introduction requests (034 tables, 037 guards+notifications). RLS enforces:
// sender-only insert (no self, no blocked pair, receiver must be open),
// party-only reads, receiver-only responds.

export type IntroRequest = {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
};

function mapRequest(row: Record<string, unknown>): IntroRequest {
  return {
    id: row.id as string,
    senderId: row.sender_id as string,
    receiverId: row.receiver_id as string,
    message: (row.message as string) ?? "",
    status: (row.status as IntroRequest["status"]) ?? "pending",
    createdAt: (row.created_at as string) ?? "",
  };
}

export async function listReceivedPendingIntros(client: SupabaseClient, userId: string): Promise<IntroRequest[]> {
  const { data, error } = await client
    .from("introduction_requests")
    .select("*")
    .eq("receiver_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => mapRequest(r as Record<string, unknown>));
}

export async function getMySentIntroTo(client: SupabaseClient, userId: string, memberId: string): Promise<IntroRequest | null> {
  const { data, error } = await client
    .from("introduction_requests")
    .select("*")
    .eq("sender_id", userId)
    .eq("receiver_id", memberId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return mapRequest(data as Record<string, unknown>);
}

export async function sendIntroductionRequest(
  client: SupabaseClient,
  userId: string,
  memberId: string,
  message: string,
): Promise<{ error: string | null }> {
  const { error } = await client
    .from("introduction_requests")
    .insert({ sender_id: userId, receiver_id: memberId, message: message.trim() });
  if (!error) return { error: null };
  // RLS rejections read as row-level violations — translate to calm copy.
  return { error: "This member isn't open to introductions right now." };
}

export async function respondIntroductionRequest(
  client: SupabaseClient,
  requestId: string,
  accept: boolean,
): Promise<{ error: string | null }> {
  const { error } = await client
    .from("introduction_requests")
    .update({ status: accept ? "accepted" : "declined", responded_at: new Date().toISOString() })
    .eq("id", requestId);
  return { error: error ? error.message : null };
}
