-- SIGNAL//FLOW MVP row-level security

alter table public.users enable row level security;
alter table public.artist_profiles enable row level security;
alter table public.scout_profiles enable row level security;
alter table public.tracks enable row level security;
alter table public.track_analysis enable row level security;
alter table public.listen_events enable row level security;
alter table public.saves enable row level security;
alter table public.backs enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;
alter table public.recommendation_batches enable row level security;

create or replace function public.is_signalflow_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "users_read_authenticated" on public.users;
create policy "users_read_authenticated" on public.users
  for select to authenticated using (true);
drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users
  for insert to authenticated with check (auth.uid() = id);
drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update to authenticated using (auth.uid() = id);
drop policy if exists "users_admin_update" on public.users;
create policy "users_admin_update" on public.users
  for update to authenticated using (public.is_signalflow_admin());

drop policy if exists "artist_profiles_read_authenticated" on public.artist_profiles;
create policy "artist_profiles_read_authenticated" on public.artist_profiles
  for select to authenticated using (true);
drop policy if exists "artist_profiles_insert_own" on public.artist_profiles;
create policy "artist_profiles_insert_own" on public.artist_profiles
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "artist_profiles_update_own" on public.artist_profiles;
create policy "artist_profiles_update_own" on public.artist_profiles
  for update to authenticated using (auth.uid() = user_id);

drop policy if exists "scout_profiles_read_authenticated" on public.scout_profiles;
create policy "scout_profiles_read_authenticated" on public.scout_profiles
  for select to authenticated using (true);
drop policy if exists "scout_profiles_insert_own" on public.scout_profiles;
create policy "scout_profiles_insert_own" on public.scout_profiles
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "scout_profiles_update_own" on public.scout_profiles;
create policy "scout_profiles_update_own" on public.scout_profiles
  for update to authenticated using (auth.uid() = user_id);

drop policy if exists "tracks_read_approved_or_owner_or_admin" on public.tracks;
create policy "tracks_read_approved_or_owner_or_admin" on public.tracks
  for select to authenticated
  using (
    status = 'approved'
    or public.is_signalflow_admin()
    or exists (
      select 1 from public.artist_profiles ap
      where ap.id = tracks.artist_id and ap.user_id = auth.uid()
    )
  );
drop policy if exists "tracks_insert_artist_own" on public.tracks;
create policy "tracks_insert_artist_own" on public.tracks
  for insert to authenticated
  with check (
    exists (
      select 1 from public.artist_profiles ap
      where ap.id = artist_id and ap.user_id = auth.uid()
    )
  );
drop policy if exists "tracks_update_owner_or_admin" on public.tracks;
create policy "tracks_update_owner_or_admin" on public.tracks
  for update to authenticated
  using (
    public.is_signalflow_admin()
    or exists (
      select 1 from public.artist_profiles ap
      where ap.id = tracks.artist_id and ap.user_id = auth.uid()
    )
  );

drop policy if exists "analysis_read_with_track_access" on public.track_analysis;
create policy "analysis_read_with_track_access" on public.track_analysis
  for select to authenticated
  using (
    exists (
      select 1 from public.tracks t
      where t.id = track_analysis.track_id
        and (
          t.status = 'approved'
          or public.is_signalflow_admin()
          or exists (
            select 1 from public.artist_profiles ap
            where ap.id = t.artist_id and ap.user_id = auth.uid()
          )
        )
    )
  );
drop policy if exists "analysis_insert_track_owner" on public.track_analysis;
create policy "analysis_insert_track_owner" on public.track_analysis
  for insert to authenticated
  with check (
    exists (
      select 1 from public.tracks t
      join public.artist_profiles ap on ap.id = t.artist_id
      where t.id = track_id and ap.user_id = auth.uid()
    )
  );

drop policy if exists "listen_events_insert_own" on public.listen_events;
create policy "listen_events_insert_own" on public.listen_events
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "listen_events_read_own_or_artist_or_admin" on public.listen_events;
create policy "listen_events_read_own_or_artist_or_admin" on public.listen_events
  for select to authenticated
  using (
    auth.uid() = user_id
    or public.is_signalflow_admin()
    or exists (
      select 1 from public.tracks t
      join public.artist_profiles ap on ap.id = t.artist_id
      where t.id = listen_events.track_id and ap.user_id = auth.uid()
    )
  );

drop policy if exists "saves_insert_own" on public.saves;
create policy "saves_insert_own" on public.saves
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "saves_read_own_or_artist_or_admin" on public.saves;
create policy "saves_read_own_or_artist_or_admin" on public.saves
  for select to authenticated
  using (
    auth.uid() = user_id
    or public.is_signalflow_admin()
    or exists (
      select 1 from public.tracks t
      join public.artist_profiles ap on ap.id = t.artist_id
      where t.id = saves.track_id and ap.user_id = auth.uid()
    )
  );

drop policy if exists "backs_insert_own" on public.backs;
create policy "backs_insert_own" on public.backs
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "backs_read_authenticated" on public.backs;
create policy "backs_read_authenticated" on public.backs
  for select to authenticated using (true);

drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own" on public.comments
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "comments_read_authenticated" on public.comments;
create policy "comments_read_authenticated" on public.comments
  for select to authenticated using (true);

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert to authenticated with check (auth.uid() = reporter_id);
drop policy if exists "reports_read_admin" on public.reports;
create policy "reports_read_admin" on public.reports
  for select to authenticated using (public.is_signalflow_admin());
drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin" on public.reports
  for update to authenticated using (public.is_signalflow_admin());

drop policy if exists "recommendations_read_own" on public.recommendation_batches;
create policy "recommendations_read_own" on public.recommendation_batches
  for select to authenticated using (auth.uid() = user_id or public.is_signalflow_admin());
drop policy if exists "recommendations_insert_admin" on public.recommendation_batches;
create policy "recommendations_insert_admin" on public.recommendation_batches
  for insert to authenticated with check (public.is_signalflow_admin());
