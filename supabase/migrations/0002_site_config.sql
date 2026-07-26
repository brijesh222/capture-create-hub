-- Site content (the JSON the admin panel edits) plus its access rules.
--
-- Replaces the original supabase-setup.sql, which granted the public
-- INSERT, UPDATE and DELETE on this table. Because the anon key ships inside
-- the site's JavaScript, that let any visitor rewrite or wipe the live site.
-- Here, the public may only read; writing requires a signed-in admin.

create table if not exists public.site_config (
  id         integer primary key default 1,
  config     jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

insert into public.site_config (id, config)
values (1, '{}')
on conflict (id) do nothing;

alter table public.site_config enable row level security;

-- Old permissive policies, dropped by name in case this runs on a project
-- where the original script was already applied.
drop policy if exists "Allow public read" on public.site_config;
drop policy if exists "Allow public insert and update" on public.site_config;
drop policy if exists "site_config public read" on public.site_config;
drop policy if exists "site_config admin write" on public.site_config;

-- Every visitor needs to read the config to render the site.
create policy "site_config public read"
  on public.site_config
  for select
  to anon, authenticated
  using (true);

-- Only a signed-in admin may change it.
create policy "site_config admin write"
  on public.site_config
  for all
  to authenticated
  using (true)
  with check (true);
