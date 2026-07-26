-- ============================================================
-- BP Productions — run this once in the Supabase SQL Editor.
-- Combines 0001_core_schema.sql and 0002_site_config.sql.
-- Run this ONCE. If you re-run it you'll see "already exists" errors,
-- which are harmless but mean it was applied before.
-- ============================================================

-- Core schema for bookings, payments and delivery.
--
-- Conventions used throughout:
--   * Money is stored as integer paise, never float. 25000 = ₹250.00
--   * Times are timestamptz. The studio works in Asia/Kolkata; the app converts.
--   * RLS is enabled on every table but policies are deliberately NOT defined here.
--     No policy means deny-all, which is the safe default while these tables are
--     unused. Policies land with the admin auth migration.

create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

create table public.services (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text not null default '',
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.packages (
  id               uuid primary key default gen_random_uuid(),
  service_id       uuid not null references public.services(id) on delete cascade,
  name             text not null,
  description      text not null default '',
  price_paise      integer not null check (price_paise >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  -- Deliverables are a display-only list, e.g. ["60 edited photos", "1 reel"]
  deliverables     jsonb not null default '[]'::jsonb,
  -- How much is due up front. 'percent' reads advance_value as 0-100.
  advance_kind     text not null default 'percent'
                   check (advance_kind in ('percent', 'fixed')),
  advance_value    integer not null default 25 check (advance_value >= 0),
  sort_order       integer not null default 0,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

create index packages_service_idx on public.packages(service_id) where is_active;

-- ---------------------------------------------------------------------------
-- Availability
-- ---------------------------------------------------------------------------

-- Recurring weekly working hours. weekday: 0 = Sunday.
create table public.availability_rules (
  id         uuid primary key default gen_random_uuid(),
  weekday    smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time   time not null,
  is_active  boolean not null default true,
  check (end_time > start_time)
);

-- One-off closures that override the weekly rules.
create table public.blackout_dates (
  id     uuid primary key default gen_random_uuid(),
  day    date not null unique,
  reason text not null default ''
);

-- ---------------------------------------------------------------------------
-- Customers and bookings
-- ---------------------------------------------------------------------------

create table public.customers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text not null,
  email      text,
  created_at timestamptz not null default now()
);

create unique index customers_phone_idx on public.customers(phone);

create table public.bookings (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid not null references public.customers(id) on delete restrict,
  package_id     uuid not null references public.packages(id) on delete restrict,

  starts_at      timestamptz not null,
  ends_at        timestamptz not null,
  location       text not null default '',
  notes          text not null default '',

  status         text not null default 'held' check (status in (
                   'held',
                   'awaiting_payment',
                   'confirmed',
                   'completed',
                   'delivered',
                   'reviewed',
                   'expired',
                   'failed',
                   'cancelled',
                   'refunded'
                 )),

  -- Set while status is 'held'. A sweeper expires rows past this instant.
  hold_expires_at timestamptz,

  -- Snapshotted at booking time so later price edits never rewrite history.
  total_paise    integer not null check (total_paise >= 0),
  advance_paise  integer not null check (advance_paise >= 0),

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  check (ends_at > starts_at),
  check (advance_paise <= total_paise)
);

-- The double-booking guard. Two bookings that still occupy the calendar may not
-- overlap in time. Cancelled/expired/failed/refunded rows drop out of the
-- constraint, freeing the slot immediately.
alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    tstzrange(starts_at, ends_at) with &&
  )
  where (status in (
    'held', 'awaiting_payment', 'confirmed', 'completed', 'delivered', 'reviewed'
  ));

create index bookings_starts_at_idx on public.bookings(starts_at);
create index bookings_status_idx on public.bookings(status);
create index bookings_hold_sweep_idx on public.bookings(hold_expires_at)
  where status = 'held';

-- ---------------------------------------------------------------------------
-- Money
-- ---------------------------------------------------------------------------

create table public.payments (
  id                  uuid primary key default gen_random_uuid(),
  booking_id          uuid not null references public.bookings(id) on delete restrict,
  kind                text not null check (kind in ('advance', 'balance', 'refund')),
  amount_paise        integer not null check (amount_paise > 0),
  status              text not null default 'created'
                      check (status in ('created', 'paid', 'failed', 'refunded')),
  razorpay_order_id   text,
  razorpay_payment_id text,
  -- Full webhook body, kept for reconciliation and disputes.
  raw                 jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Razorpay may deliver the same webhook more than once. These make the
-- handler's upsert idempotent rather than double-crediting a booking.
create unique index payments_order_idx on public.payments(razorpay_order_id)
  where razorpay_order_id is not null;
create unique index payments_payment_idx on public.payments(razorpay_payment_id)
  where razorpay_payment_id is not null;
create index payments_booking_idx on public.payments(booking_id);

-- Gapless sequential numbering, which GST requires. A plain postgres sequence
-- leaves gaps on rollback, so the counter is a row we lock instead.
create table public.invoice_counter (
  fy      text primary key,   -- e.g. '2026-27'
  last_no integer not null default 0
);

create table public.invoices (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete restrict,
  number     text not null unique,      -- e.g. 'BP/2026-27/0007'
  issued_at  timestamptz not null default now(),
  -- Line items and totals frozen at issue time.
  snapshot   jsonb not null,
  gst_paise  integer not null default 0 check (gst_paise >= 0),
  pdf_path   text
);

-- ---------------------------------------------------------------------------
-- After the shoot
-- ---------------------------------------------------------------------------

create table public.galleries (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null unique references public.bookings(id) on delete cascade,
  -- Either a Storage prefix or a pasted external link, depending on which
  -- delivery approach we settle on.
  storage_path text,
  external_url text,
  expires_at   timestamptz,
  delivered_at timestamptz,
  created_at   timestamptz not null default now(),
  check (storage_path is not null or external_url is not null)
);

create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null unique references public.bookings(id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  body        text not null default '',
  -- Nothing reaches the public site until an admin approves it.
  status      text not null default 'pending'
              check (status in ('pending', 'approved', 'hidden')),
  created_at  timestamptz not null default now()
);

create index reviews_public_idx on public.reviews(created_at desc)
  where status = 'approved';

create table public.referrals (
  id                uuid primary key default gen_random_uuid(),
  code              text not null unique,
  owner_customer_id uuid not null references public.customers(id) on delete cascade,
  reward_kind       text not null default 'percent'
                    check (reward_kind in ('percent', 'fixed')),
  reward_value      integer not null default 10 check (reward_value >= 0),
  max_uses          integer not null default 0,  -- 0 = unlimited
  used_count        integer not null default 0 check (used_count >= 0),
  expires_at        timestamptz,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Outbound messages
-- ---------------------------------------------------------------------------

create table public.notifications (
  id              uuid primary key default gen_random_uuid(),
  booking_id      uuid references public.bookings(id) on delete cascade,
  channel         text not null check (channel in ('whatsapp', 'email')),
  template        text not null,
  -- Scheduled jobs retry. This is what stops a retry from messaging a
  -- customer twice at six in the morning.
  idempotency_key text not null unique,
  status          text not null default 'pending'
                  check (status in ('pending', 'sent', 'failed')),
  scheduled_for   timestamptz,
  sent_at         timestamptz,
  error           text,
  payload         jsonb,
  created_at      timestamptz not null default now()
);

create index notifications_due_idx on public.notifications(scheduled_for)
  where status = 'pending';

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger bookings_touch
  before update on public.bookings
  for each row execute function public.touch_updated_at();

create trigger payments_touch
  before update on public.payments
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: on everywhere, policies intentionally absent (deny-all) until auth lands
-- ---------------------------------------------------------------------------

alter table public.services           enable row level security;
alter table public.packages           enable row level security;
alter table public.availability_rules enable row level security;
alter table public.blackout_dates     enable row level security;
alter table public.customers          enable row level security;
alter table public.bookings           enable row level security;
alter table public.payments           enable row level security;
alter table public.invoice_counter    enable row level security;
alter table public.invoices           enable row level security;
alter table public.galleries          enable row level security;
alter table public.reviews            enable row level security;
alter table public.referrals          enable row level security;
alter table public.notifications      enable row level security;

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
