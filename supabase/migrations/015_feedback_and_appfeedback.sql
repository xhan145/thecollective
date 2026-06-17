-- Collective Web Beta — structured feedback + app feedback fields (additive).
-- Run after 014. Safe to re-run.

-- Structured peer feedback (keep body/tone for back-compat; body becomes a summary).
alter table public.feedback add column if not exists clarity_note text;
alter table public.feedback add column if not exists useful_note text;
alter table public.feedback add column if not exists next_step_note text;

-- Closed-beta app feedback extras (message maps to existing body, screen to route).
alter table public.app_feedback add column if not exists rating integer;
alter table public.app_feedback add column if not exists status text not null default 'new';
