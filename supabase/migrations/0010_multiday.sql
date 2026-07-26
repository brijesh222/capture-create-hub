-- Multi-day bookings (e.g. a three-day wedding).
--
-- A booking already spans starts_at..ends_at, and the exclusion constraint
-- correctly rejects anything overlapping that whole window. The gap is the
-- calendar *display*: busy_slots emitted one row per booking, so only the first
-- day of a multi-day booking showed as taken.
--
-- This rebuilds busy_slots to expand a multi-day booking into one fully-blocked
-- row per day, so the calendar greys out the entire span. Single-day bookings
-- are unchanged (their own slot).

create or replace view public.busy_slots as
  -- Single-day bookings keep their specific slot.
  select
    (starts_at at time zone 'Asia/Kolkata')::date as day,
    slot_id
  from public.bookings
  where status in (
      'held', 'awaiting_payment', 'confirmed', 'completed', 'delivered', 'reviewed'
    )
    and (hold_expires_at is null or hold_expires_at > now())
    and (starts_at at time zone 'Asia/Kolkata')::date
        = (ends_at at time zone 'Asia/Kolkata')::date

  union all

  -- Multi-day bookings block every day they touch, all slots.
  select
    d::date as day,
    'fullday' as slot_id
  from public.bookings b
  cross join lateral generate_series(
    (b.starts_at at time zone 'Asia/Kolkata')::date,
    (b.ends_at   at time zone 'Asia/Kolkata')::date,
    interval '1 day'
  ) d
  where b.status in (
      'held', 'awaiting_payment', 'confirmed', 'completed', 'delivered', 'reviewed'
    )
    and (b.hold_expires_at is null or b.hold_expires_at > now())
    and (b.starts_at at time zone 'Asia/Kolkata')::date
        <> (b.ends_at at time zone 'Asia/Kolkata')::date;

grant select on public.busy_slots to anon, authenticated;
