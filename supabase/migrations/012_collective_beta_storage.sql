-- Collective Web Beta — storage bucket for proof attachments.
-- Public read for the closed-beta MVP so cohort proof media renders directly.
-- Tighten to signed URLs before any public launch.

insert into storage.buckets (id, name, public)
values ('collective-proof-media', 'collective-proof-media', true)
on conflict (id) do update set public = true;

-- Upload only into your own folder: {user_id}/{proof_id}/{file}
drop policy if exists "collective_proof_upload_own_folder" on storage.objects;
create policy "collective_proof_upload_own_folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'collective-proof-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public bucket -> anyone can read (closed-beta MVP convenience).
drop policy if exists "collective_proof_read_public" on storage.objects;
create policy "collective_proof_read_public" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'collective-proof-media');

-- Delete only your own files.
drop policy if exists "collective_proof_delete_own" on storage.objects;
create policy "collective_proof_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'collective-proof-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
