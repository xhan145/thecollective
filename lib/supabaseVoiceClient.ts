import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

export type AuthenticatedSupabase = {
  accessToken: string;
  supabase: SupabaseClient;
  user: User;
};

export function getSupabasePublicConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  };
}

export function createSupabaseBrowserClient() {
  const { url, anonKey } = getSupabasePublicConfig();
  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}

export function getBearerToken(request: Request) {
  const header = request.headers.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export function createSupabaseForAccessToken(accessToken: string) {
  const { url, anonKey } = getSupabasePublicConfig();
  if (!url || !anonKey) {
    throw new Error("Supabase is not configured.");
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  });
}

export async function requireSupabaseUser(request: Request): Promise<AuthenticatedSupabase> {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    throw new Response(JSON.stringify({ error: "Sign in to use the voice coach." }), {
      status: 401,
      headers: { "content-type": "application/json" }
    });
  }

  const supabase = createSupabaseForAccessToken(accessToken);
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new Response(JSON.stringify({ error: "Your session could not be verified." }), {
      status: 401,
      headers: { "content-type": "application/json" }
    });
  }

  return { accessToken, supabase, user: data.user };
}

