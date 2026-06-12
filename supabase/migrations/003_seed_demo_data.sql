-- SIGNAL//FLOW demo seed data
-- Safe to re-run. These demo users are for local review and are not auth users.

insert into public.users (id, email, role, display_name)
values
  ('00000000-0000-4000-8000-000000000101', 'artist@signalflow.demo', 'artist', 'Nyx Relay'),
  ('00000000-0000-4000-8000-000000000102', 'glass@signalflow.demo', 'artist', 'Glass Teeth'),
  ('00000000-0000-4000-8000-000000000201', 'scout@signalflow.demo', 'scout', 'Flowfinder 23'),
  ('00000000-0000-4000-8000-000000000301', 'admin@signalflow.demo', 'admin', 'S//F Admin')
on conflict (id) do update
  set email = excluded.email,
      role = excluded.role,
      display_name = excluded.display_name;

insert into public.artist_profiles
  (id, user_id, artist_name, bio, location, genres, links)
values
  (
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000101',
    'Nyx Relay',
    'Basement electronics, pressure systems, and nocturnal hooks.',
    'Detroit, MI',
    array['bass', 'experimental trap', 'electronic'],
    '{"soundcloud":"https://soundcloud.com/demo"}'::jsonb
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000102',
    'Glass Teeth',
    'Haunted club sketches with a pop nerve.',
    'Baltimore, MD',
    array['hyperpop', 'club'],
    null
  )
on conflict (id) do update
  set artist_name = excluded.artist_name,
      bio = excluded.bio,
      location = excluded.location,
      genres = excluded.genres,
      links = excluded.links;

insert into public.scout_profiles
  (id, user_id, favorite_genres, favorite_moods, scout_level, flowfinder_score, backed_count)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000201',
    array['bass', 'experimental trap', 'club'],
    array['dark', 'gritty', 'hypnotic'],
    'Flowfinder',
    138,
    7
  )
on conflict (id) do update
  set favorite_genres = excluded.favorite_genres,
      favorite_moods = excluded.favorite_moods,
      scout_level = excluded.scout_level,
      flowfinder_score = excluded.flowfinder_score,
      backed_count = excluded.backed_count;

insert into public.tracks
  (id, artist_id, title, description, genre_tags, mood_tags, audio_url, artwork_url, duration_seconds, status, discovery_stage, rights_confirmed)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'Substation Halo',
    'Dark cyberpunk bass with a metallic hook and a pressure-drop second half.',
    array['bass', 'experimental trap', 'electronic'],
    array['dark', 'gritty', 'hypnotic'],
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    null,
    198,
    'approved',
    'first_50',
    true
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000002',
    'Velvet Circuit',
    'A glossy high-voltage chorus folded into a basement club loop.',
    array['hyperpop', 'club', 'electronic'],
    array['euphoric', 'volatile'],
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    null,
    176,
    'approved',
    'first_50',
    true
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    'Low Orbit Witness',
    'A draft signal waiting for admin review.',
    array['ambient', 'bass'],
    array['haunted', 'lonely'],
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    null,
    221,
    'pending_review',
    'uploaded',
    true
  )
on conflict (id) do update
  set title = excluded.title,
      description = excluded.description,
      genre_tags = excluded.genre_tags,
      mood_tags = excluded.mood_tags,
      audio_url = excluded.audio_url,
      duration_seconds = excluded.duration_seconds,
      status = excluded.status,
      discovery_stage = excluded.discovery_stage,
      rights_confirmed = excluded.rights_confirmed;

insert into public.track_analysis
  (track_id, bpm, key, energy, mood_summary, genre_summary, sonic_description, similar_currents, strongest_moment, mix_notes, promo_angle)
values
  (
    '30000000-0000-4000-8000-000000000001',
    128,
    'F minor',
    92,
    'Dark energy with nocturnal mood, tuned for Scouts who listen past the first obvious hook.',
    'Bass signal shaped by experimental trap, electronic.',
    'Cinematic low-end pressure with nocturnal mood, a clean foreground idea, and enough negative space to feel discovered rather than announced.',
    array['dark bass basements', 'No Clout Mode discovery queues', 'first-wave underground club clips'],
    'The Mekhane Engine flags the first major switch as the strongest moment.',
    'The low end carries impact well. Keep the transient edge controlled so the drop stays heavy without crowding the lead motif.',
    'Position "Substation Halo" as a Hidden Signal for Scouts who want dark bass before the wider current finds it.'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    128,
    'A minor',
    84,
    'Euphoric energy with bright lift and volatile release pressure.',
    'Hyperpop signal shaped by club and electronic crossover instincts.',
    'Glossy maximalist charge with late-night club motion and a hook that arrives fast.',
    array['euphoric hyperpop basements', 'No Clout Mode discovery queues', 'first-wave underground club clips'],
    'The pre-chorus lift is the strongest moment.',
    'Keep the high-end shimmer controlled so the vocal space stays expensive on phone speakers.',
    'Pitch "Velvet Circuit" as Early Current for Scouts who back high-voltage pop before it clears the basement.'
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    92,
    'F minor',
    48,
    'Haunted energy with ghosted negative space.',
    'Ambient signal shaped by bass drift.',
    'Wide atmospheric drift with isolated after-hours glow and submerged low-end pressure.',
    array['haunted ambient rooms', 'No Clout Mode discovery queues', 'low-light headphones'],
    'The final minute is the strongest moment.',
    'The atmosphere is doing useful work. Bring the lead motif forward by a shade.',
    'Position "Low Orbit Witness" as a Hidden Signal for Scouts who wait for the slow bloom.'
  )
on conflict (track_id) do update
  set bpm = excluded.bpm,
      key = excluded.key,
      energy = excluded.energy,
      mood_summary = excluded.mood_summary,
      genre_summary = excluded.genre_summary,
      sonic_description = excluded.sonic_description,
      similar_currents = excluded.similar_currents,
      strongest_moment = excluded.strongest_moment,
      mix_notes = excluded.mix_notes,
      promo_angle = excluded.promo_angle;

insert into public.listen_events
  (track_id, user_id, seconds_played, completed, skipped, saved, backed)
values
  ('30000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000201', 46, true, false, false, true),
  ('30000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000201', 24, false, false, true, false);

insert into public.saves (user_id, track_id)
values ('00000000-0000-4000-8000-000000000201', '30000000-0000-4000-8000-000000000002')
on conflict (user_id, track_id) do nothing;

insert into public.backs
  (user_id, track_id, artist_id, listener_number, artist_followers_at_backing)
values
  (
    '00000000-0000-4000-8000-000000000201',
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    23,
    0
  )
on conflict (user_id, track_id) do nothing;

insert into public.reports
  (reporter_id, target_type, target_id, reason, status)
values
  (
    '00000000-0000-4000-8000-000000000201',
    'track',
    '30000000-0000-4000-8000-000000000002',
    'Demo moderation queue item.',
    'open'
  );
