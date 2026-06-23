-- 025_personalization.sql — onboarding answers + practice tagging (additive).
-- Run AFTER 010–024. Idempotent. NOTE: apply when the Supabase MCP/connection is back.
alter table public.profiles add column if not exists goal_text text;
alter table public.profiles add column if not exists starting_level text check (starting_level in ('starter','building','comfortable'));
alter table public.profiles add column if not exists context_tags text[] not null default '{}';
alter table public.profiles add column if not exists cadence text;

alter table public.practices add column if not exists level text not null default 'starter';
alter table public.practices add column if not exists context_tags text[] not null default '{}';
alter table public.practices add column if not exists proof_prompt text;

-- Per-practice tagging of the live `practices` rows mirrors lib/betaData.ts seedPrompts
-- (id/slug -> level/context_tags/proof_prompt). Apply as UPDATEs when MCP is back;
-- the canonical mapping is the seedPrompts array in lib/betaData.ts.
