-- Collective Web Beta — directions & practices as real content tables.
-- Additive: run after 010–012. App loads these at runtime and falls back to
-- the in-app seed (lib/betaData.ts) if the tables are empty/unreachable.

create extension if not exists "pgcrypto";

create table if not exists public.directions (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  beginner_safe_prompt text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.practices (
  id uuid primary key default gen_random_uuid(),
  direction_id uuid not null references public.directions(id) on delete cascade,
  title text not null,
  description text,
  instructions text,
  estimated_minutes integer not null default 5,
  proof_prompt text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (direction_id, title)
);
create index if not exists practices_direction_idx on public.practices(direction_id);

-- Read-only content: any signed-in (or anon) visitor can read active rows.
alter table public.directions enable row level security;
alter table public.practices enable row level security;

drop policy if exists "directions_read_active" on public.directions;
create policy "directions_read_active" on public.directions
  for select to anon, authenticated using (is_active = true);

drop policy if exists "practices_read_active" on public.practices;
create policy "practices_read_active" on public.practices
  for select to anon, authenticated using (is_active = true);

-- ---------- Seed (idempotent) ----------
insert into public.directions (slug, title, description, beginner_safe_prompt, sort_order)
values
  ('confident-communication', 'Confident Communication',
   'Practice speaking clearly, asking better questions, and sharing your ideas with calm confidence.',
   'Choose one idea. Explain it simply. Clarity, not perfection.', 0),
  ('momentum', 'Momentum',
   'Build small actions into visible progress.',
   'Pick one tiny step you can finish today.', 1),
  ('clearer-thinking', 'Clearer Thinking',
   'Practice reflection, decision-making, and explaining what matters.',
   'Write one honest sentence about what you are deciding.', 2)
on conflict (slug) do update
  set title = excluded.title,
      description = excluded.description,
      beginner_safe_prompt = excluded.beginner_safe_prompt,
      sort_order = excluded.sort_order,
      is_active = true;

insert into public.practices (direction_id, title, description, instructions, estimated_minutes, proof_prompt, sort_order)
select d.id, p.title, p.description, p.instructions, p.minutes, p.proof_prompt, p.sort_order
from public.directions d
join (
  values
    ('Record a 60-second voice note',
     'Explain one idea simply in under a minute.',
     'Choose one idea. Explain it simply in under 60 seconds. Focus on clarity, not perfection.',
     5,
     'What did you explain, and what felt clearer after practicing?', 0),
    ('Ask one better question',
     'Turn a vague question into a useful one.',
     'In a real or imagined conversation, turn a vague question into a more useful one.',
     5,
     'What was the original question, and what better question did you create?', 1),
    ('Explain one idea clearly',
     'Write or record a short, simple explanation.',
     'Write or record a short explanation of one idea you care about. Keep it simple.',
     7,
     'What idea did you explain, and what would you improve next time?', 2)
) as p(title, description, instructions, minutes, proof_prompt, sort_order) on true
where d.slug = 'confident-communication'
on conflict (direction_id, title) do update
  set description = excluded.description,
      instructions = excluded.instructions,
      estimated_minutes = excluded.estimated_minutes,
      proof_prompt = excluded.proof_prompt,
      sort_order = excluded.sort_order,
      is_active = true;
