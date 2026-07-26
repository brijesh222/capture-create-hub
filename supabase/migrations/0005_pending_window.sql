-- Widens the public hold window from 1 hour to 48, and reframes what a 'held'
-- booking means before payments exist.
--
-- Why: anonymous visitors may insert a booking but never update one — that is
-- what stops someone promoting their own booking to 'confirmed' and skipping
-- payment. The side effect is that a short hold taken when the customer picks
-- a slot can never be extended when they finish the form, so it would expire
-- mid-booking.
--
-- Instead the row is created once, on submit, and holds the slot for 48 hours
-- while the studio confirms it. If nobody confirms, it lapses and the date
-- frees itself. The exclusion constraint still makes double-booking impossible:
-- whoever submits first wins and the second submit is rejected.
--
-- Once payments are live, the payment function (running with server-side
-- rights) can take proper short holds again and promote them on success.

drop policy if exists "bookings public hold" on public.bookings;

create policy "bookings public hold"
  on public.bookings
  for insert
  to anon, authenticated
  with check (
    status = 'held'
    and hold_expires_at is not null
    and hold_expires_at > now()
    -- Long enough for the studio to respond, short enough that an abandoned
    -- or malicious booking cannot block a date indefinitely.
    and hold_expires_at < now() + interval '48 hours'
  );
