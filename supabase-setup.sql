-- Run this in your Supabase project (SQL Editor) to enable cloud config sync.
-- Then set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env and rebuild.

create table if not exists public.site_config (
  id integer primary key default 1,
  config jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- Insert initial row so upsert works
insert into public.site_config (id, config)
values (1, '{}')
on conflict (id) do nothing;

-- Optional: allow public read so all visitors get the same config
alter table public.site_config enable row level security;

create policy "Allow public read"
  on public.site_config for select
  using (true);

create policy "Allow public insert and update"
  on public.site_config for all
  using (true)
  with check (true);
