-- Cash / pay-in-person bookings.
--
-- Not every customer pays online. The professional pattern (Wix, Events
-- Manager, Stripe) is: let them reserve with "pay in person", create the
-- booking as pending, and have the studio manually mark it paid when the cash
-- arrives — which then confirms it. The slot is still held meanwhile, so a cash
-- reservation can't be double-booked.

-- How the booking was taken. Online bookings go through Razorpay; cash ones are
-- confirmed by the studio by hand.
alter table public.bookings
  add column if not exists payment_method text not null default 'online'
    check (payment_method in ('online', 'cash'));

-- How a payment actually arrived, so the ledger distinguishes Razorpay from
-- cash received in person.
alter table public.payments
  add column if not exists method text not null default 'online'
    check (method in ('online', 'cash'));
