"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase/client";
import { qk } from "@/lib/query/keys";

/**
 * Cached, deduped signed GET URL for a PRIVATE storage object. Returns a stable URL
 * reused across renders/components and only re-signed near expiry. For public media,
 * use getPublicUrl instead — this hook is for private buckets (e.g. coach-audio).
 */
export function useSignedMediaUrl(
  bucket: string,
  path: string | null,
  opts?: { expiresIn?: number },
): { url: string | null; isLoading: boolean; isError: boolean } {
  const expiresIn = opts?.expiresIn ?? 3600;
  const query = useQuery({
    queryKey: qk.signedUrl(bucket, path ?? ""),
    enabled: !!path,
    staleTime: (expiresIn - 60) * 1000,
    queryFn: async () => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase client unavailable");
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path as string, expiresIn);
      if (error || !data?.signedUrl) throw new Error(error?.message || "Could not sign media URL");
      return data.signedUrl;
    },
  });
  return { url: query.data ?? null, isLoading: query.isLoading, isError: query.isError };
}
