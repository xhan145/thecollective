/**
 * Create a beta invite code (server-side, service role).
 *
 * Usage:
 *   tsx scripts/create-beta-invite.ts [--code CODE] [--email a@b.com]
 *        [--max-uses N] [--expires 2026-12-31] [--notes "..."]
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Invite codes are a controlled beta gate, not a high-security secret.
 */
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

const args = process.argv.slice(2);
function arg(flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

function randomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let n = 0;
  // Length 8; vary by argv index so repeated runs differ.
  const seed = (Date.now() + args.length) >>> 0;
  let s = seed;
  let out = "";
  for (let i = 0; i < 8; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    out += alphabet[(s >>> (i % 16)) % alphabet.length];
    n += 1;
  }
  void n;
  return `BETA-${out}`;
}

async function main() {
  const code = (arg("--code") || randomCode()).toUpperCase();
  const email = arg("--email") || null;
  const maxUses = Number(arg("--max-uses") || "1");
  const expires = arg("--expires") || null;
  const notes = arg("--notes") || null;

  const sb = createClient(URL, KEY, { auth: { persistSession: false } });
  const { data, error } = await sb
    .from("beta_invites")
    .insert({
      code,
      email,
      max_uses: Number.isFinite(maxUses) && maxUses > 0 ? maxUses : 1,
      status: "active",
      expires_at: expires ? new Date(expires).toISOString() : null,
      notes,
    })
    .select("code, email, max_uses, expires_at")
    .single();

  if (error) {
    console.error("Failed to create invite:", error.message);
    process.exit(1);
  }
  console.log("Invite created:");
  console.log(JSON.stringify(data, null, 2));
}

void main();
