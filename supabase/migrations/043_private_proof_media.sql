-- 043_private_proof_media.sql — Package 0 (R2). Close the public-bucket hole.
-- The collective-proof-media bucket was public=true with an anon-readable
-- SELECT policy, so private-intended proof media was anon-readable by URL.
-- Make the bucket PRIVATE and gate object reads (signed-URL creation) to the
-- owner or a beta_community viewer, mirroring the proofs SELECT policy.
--
-- Object path scheme (uploadProofFile): {userId}/{proofId}/{ts-file}
--   -> storage.foldername(name)[1] = userId, [2] = proofId.

-- 1) Privatize the bucket.
update storage.buckets set public = false where id = 'collective-proof-media';

-- 2) Remove the anon/public read policy.
drop policy if exists "collective_proof_read_public" on storage.objects;

-- 3) Authorized read (owner or beta_community-visible, block- and moderation-
--    aware). Compare proof id as text to avoid uuid-cast errors on any legacy
--    path shape.
drop policy if exists "collective_proof_read_authorized" on storage.objects;
create policy "collective_proof_read_authorized" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'collective-proof-media'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.proofs p
        where p.id::text = (storage.foldername(name))[2]
          and p.visibility = 'beta_community'
          and p.moderation_status not in ('pending','removed')
          and not exists (
            select 1 from public.blocked_users b
             where (b.blocker_id = p.user_id and b.blocked_id = auth.uid())
                or (b.blocker_id = auth.uid() and b.blocked_id = p.user_id)
          )
      )
    )
  );

-- (Owner insert/delete policies from the original setup are unchanged:
--  collective_proof_upload_own_folder, collective_proof_delete_own.)
