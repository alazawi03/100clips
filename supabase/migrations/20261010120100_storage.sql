-- File storage. Every path starts with a folder that says who it belongs to.
--
--   public-media   {user id}/...   creator photos and samples, brand logos, product photos. Public links.
--   private-docs   {user id}/...   intro videos and VAT certificates. The owner and admins.
--   clips          {order id}/...  clips made for orders. The order's brand and creator, admins, and
--                                  anyone signed in once the clip is in public_clips.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('public-media', 'public-media', true, 104857600, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']),
  ('private-docs', 'private-docs', false, 104857600, array['video/mp4', 'video/quicktime', 'application/pdf', 'image/jpeg', 'image/png']),
  -- Clips are up to 3 minutes: a phone video can reach a few hundred MB. Needs the Pro plan's upload limit.
  ('clips', 'clips', false, 524288000, array['video/mp4', 'video/quicktime']);

-- Your own folder in public-media and private-docs. A file sent with an application (intro or sample)
-- can't be changed or deleted, so the admin can always compare submissions.
create policy "Read own files" on storage.objects for select to authenticated
  using (bucket_id in ('public-media', 'private-docs') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Upload own files" on storage.objects for insert to authenticated
  with check (bucket_id in ('public-media', 'private-docs') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Change own files" on storage.objects for update to authenticated
  using (bucket_id in ('public-media', 'private-docs') and (storage.foldername(name))[1] = (select auth.uid())::text
    and not exists (select 1 from public.creator_approvals a where a.creator_id = (select auth.uid()) and (a.intro_video_path = name or name = any(a.sample_paths))))
  with check (bucket_id in ('public-media', 'private-docs') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Delete own files" on storage.objects for delete to authenticated
  using (bucket_id in ('public-media', 'private-docs') and (storage.foldername(name))[1] = (select auth.uid())::text
    and not exists (select 1 from public.creator_approvals a where a.creator_id = (select auth.uid()) and (a.intro_video_path = name or name = any(a.sample_paths))));
create policy "Admins read private docs" on storage.objects for select to authenticated
  using (bucket_id = 'private-docs' and private.is_admin());

-- The creator uploads while the order waits for a clip (submit_clip records it).
create policy "Creator uploads order clips" on storage.objects for insert to authenticated with check (
  bucket_id = 'clips' and exists (
    select 1 from public.orders o
    where o.id::text = (storage.foldername(name))[1] and o.creator_id = (select auth.uid()) and o.status = 'in_progress'
  )
);
create policy "Read order clips" on storage.objects for select to authenticated using (
  bucket_id = 'clips' and (
    exists (select 1 from public.orders o where o.id::text = (storage.foldername(name))[1] and private.can_see_order(o.id))
    or exists (select 1 from public.public_clips c where c.video_path = name)
  )
);
