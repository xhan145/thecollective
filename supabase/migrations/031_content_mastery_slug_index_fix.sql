-- Collective — Content Mastery slug-index fix.
-- 030 created practices_slug_uidx as a PARTIAL unique index (WHERE slug is not null).
-- PostgREST upsert(onConflict: "slug") cannot express the partial predicate, so
-- Postgres cannot infer it and the seed fails with 42P10. A full unique index on
-- the nullable slug column is correct here: multiple NULL slugs (legacy practices)
-- remain allowed because NULLs are distinct in a unique index.
-- Idempotent: drop the partial index, create the full one.

drop index if exists public.practices_slug_uidx;
create unique index if not exists practices_slug_uidx on public.practices(slug);
