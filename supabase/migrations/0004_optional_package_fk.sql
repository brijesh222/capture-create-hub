-- Packages currently live in the site_config JSON, not in the `packages` table,
-- because that is what the admin panel edits. A booking therefore has no uuid
-- to point at, and the NOT NULL foreign key made every insert fail with
-- "null value in column package_id violates not-null constraint".
--
-- The booking already records `package_ref` (the config id, e.g. "mt1") and
-- `service_slug`, which is enough to price and describe it. The foreign key
-- stays for when packages are normalised into their own table later.

alter table public.bookings
  alter column package_id drop not null;

-- Same reasoning for the price snapshot: it is taken from the config at
-- booking time, so nothing needs to resolve through the packages table.
comment on column public.bookings.package_ref is
  'Config package id (e.g. "mt1"). Used until packages are normalised.';

comment on column public.bookings.package_id is
  'Set only once packages exist as rows. Null for config-driven bookings.';
