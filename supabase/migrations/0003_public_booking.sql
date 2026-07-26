-- Lets the public site create bookings and see which slots are taken, without
-- exposing anyone's personal details.
--
-- The problem this solves: a visitor needs to know 15 August is unavailable,
-- but must never be able to read who booked it or their phone number. Granting
-- SELECT on `bookings` would leak every customer's contact details to anyone
-- with the publishable key — which is in the JS bundle.

-- ---------------------------------------------------------------------------
-- Enquiry-stage bookings carry contact details directly
-- ---------------------------------------------------------------------------
-- Before payment there is no reason to create a customer record, and requiring
-- one would mean granting the public write access to the customers table too.
-- A customer row gets linked when a booking is actually confirmed.

alter table public.bookings
  alter column customer_id drop not null;

alter table public.bookings
  add column if not exists contact_name  text not null default '',
  add column if not exists contact_phone text not null default '',
  add column if not exists contact_email text,
  add column if not exists location_note text not null default '',
  add column if not exists customer_notes text not null default '',
  add column if not exists slot_id       text not null default '',
  add column if not exists service_slug  text not null default '',
  add column if not exists package_ref   text not null default '',
  add column if not exists pay_mode      text not null default 'advance'
    check (pay_mode in ('advance', 'full'));

-- ---------------------------------------------------------------------------
-- What the public may read: occupied slots, and nothing else
-- ---------------------------------------------------------------------------
-- A view exposing only the date and slot. No names, phones, emails or amounts.
-- Runs with the owner's rights, so it can read the table the public cannot.

create or replace view public.busy_slots as
  select
    (starts_at at time zone 'Asia/Kolkata')::date as day,
    slot_id
  from public.bookings
  where status in (
    'held', 'awaiting_payment', 'confirmed', 'completed', 'delivered', 'reviewed'
  );

grant select on public.busy_slots to anon, authenticated;

-- ---------------------------------------------------------------------------
-- What the public may write: a held booking, nothing more
-- ---------------------------------------------------------------------------

drop policy if exists "bookings public hold" on public.bookings;
drop policy if exists "bookings admin all" on public.bookings;

-- Anyone may create a booking, but only in 'held' state. They cannot insert
-- something already 'confirmed' and skip payment, and cannot set a hold that
-- never expires.
create policy "bookings public hold"
  on public.bookings
  for insert
  to anon, authenticated
  with check (
    status = 'held'
    and hold_expires_at is not null
    and hold_expires_at > now()
    and hold_expires_at < now() + interval '1 hour'
  );

-- Deliberately no SELECT, UPDATE or DELETE policy for anon: a visitor can
-- create a booking but can never read one back, change one, or remove one.

-- A signed-in admin gets full access.
create policy "bookings admin all"
  on public.bookings
  for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Expired holds stop blocking the calendar
-- ---------------------------------------------------------------------------
-- The exclusion constraint counts 'held' rows, so an abandoned checkout would
-- keep a date locked forever. This releases them; call it before reading
-- availability.

create or replace function public.release_expired_holds()
returns void
language sql
security definer
set search_path = public
as $$
  update public.bookings
     set status = 'expired'
   where status = 'held'
     and hold_expires_at is not null
     and hold_expires_at < now();
$$;

grant execute on function public.release_expired_holds() to anon, authenticated;
