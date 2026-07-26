-- Public image storage for admin uploads (logos, photos, galleries).
--
-- One public bucket: anyone can view images (they're on a public website), but
-- only a signed-in admin can upload or delete. This is what lets the admin
-- upload a photo instead of pasting a fragile Google Drive link.

insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

-- Public read — the website shows these images to everyone.
drop policy if exists "site-images public read" on storage.objects;
create policy "site-images public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'site-images');

-- Only an admin may add or change images.
drop policy if exists "site-images admin write" on storage.objects;
create policy "site-images admin write"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'site-images' and public.is_admin())
  with check (bucket_id = 'site-images' and public.is_admin());
