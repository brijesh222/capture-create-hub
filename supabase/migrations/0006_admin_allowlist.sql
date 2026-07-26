-- Scopes admin access to an explicit allowlist instead of "anyone signed in".
--
-- The previous policies said `to authenticated using (true)`, written on the
-- assumption that the studio owner would be the only account. Public signup was
-- still enabled, so anyone could register and immediately gain full access to
-- every customer's name, phone and email, plus the site config.
--
-- Signup should also be disabled in the dashboard. This migration makes the
-- database safe regardless of that setting: being logged in is no longer
-- enough, you must be on the list.

create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Admins may see the list; nobody may edit it through the API. Adding an admin
-- is a deliberate act done in the dashboard, not something the app can do.
drop policy if exists "admin_users self read" on public.admin_users;
create policy "admin_users self read"
  on public.admin_users
  for select
  to authenticated
  using (user_id = auth.uid());

-- Seed from the existing account so nobody is locked out by this migration.
insert into public.admin_users (user_id, email)
select id, email from auth.users
where email = 'brijeshprajapat52@gmail.com'
on conflict (user_id) do nothing;

/**
 * True when the caller is a listed admin.
 *
 * SECURITY DEFINER so the policy can read admin_users regardless of the
 * caller's own permissions, with search_path pinned so the function cannot be
 * hijacked by a shadowing table on someone else's path.
 */
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

revoke execute on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Re-scope the permissive policies
-- ---------------------------------------------------------------------------

drop policy if exists "bookings admin all" on public.bookings;
create policy "bookings admin all"
  on public.bookings
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "site_config admin write" on public.site_config;
create policy "site_config admin write"
  on public.site_config
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Loose ends the linter flagged
-- ---------------------------------------------------------------------------

-- Pin the trigger function's search_path for the same hijacking reason.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Sweeping expired holds is maintenance, not something a visitor should be
-- able to trigger repeatedly. The public site no longer calls it; reads of
-- busy_slots filter expired holds out directly instead.
revoke execute on function public.release_expired_holds() from anon;

-- Exclude lapsed holds at read time, so a stale row never blocks a date even
-- if the sweep has not run.
create or replace view public.busy_slots as
  select
    (starts_at at time zone 'Asia/Kolkata')::date as day,
    slot_id
  from public.bookings
  where status in (
    'held', 'awaiting_payment', 'confirmed', 'completed', 'delivered', 'reviewed'
  )
  and (hold_expires_at is null or hold_expires_at > now());

grant select on public.busy_slots to anon, authenticated;
