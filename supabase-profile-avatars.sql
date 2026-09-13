-- Run once in the Supabase SQL editor before using uploads from the profile editor.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-avatars', 'profile-avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload their own profile avatar" on storage.objects;
create policy "Users upload their own profile avatar"
on storage.objects for insert to authenticated
with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "Users update their own profile avatar" on storage.objects;
create policy "Users update their own profile avatar"
on storage.objects for update to authenticated
using (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text))
with check (bucket_id = 'profile-avatars' and (storage.foldername(name))[1] = (select auth.uid()::text));
