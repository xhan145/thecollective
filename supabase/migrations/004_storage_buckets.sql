-- SIGNAL//FLOW storage buckets for track audio and artwork.
-- Buckets are public for MVP playback/review. Tighten this later if needed.

insert into storage.buckets (id, name, public)
values ('track-audio', 'track-audio', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('track-artwork', 'track-artwork', true)
on conflict (id) do update set public = true;

drop policy if exists "track_audio_upload_own_folder" on storage.objects;
create policy "track_audio_upload_own_folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'track-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "track_audio_read_public" on storage.objects;
create policy "track_audio_read_public" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'track-audio');

drop policy if exists "track_audio_delete_own" on storage.objects;
create policy "track_audio_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'track-audio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "track_artwork_upload_own_folder" on storage.objects;
create policy "track_artwork_upload_own_folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'track-artwork'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "track_artwork_read_public" on storage.objects;
create policy "track_artwork_read_public" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'track-artwork');

drop policy if exists "track_artwork_delete_own" on storage.objects;
create policy "track_artwork_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'track-artwork'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
