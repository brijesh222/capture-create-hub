-- Everything the admin lifecycle needs: reading payments/invoices, managing
-- galleries, and moderating reviews — plus public review submission and public
-- read of approved reviews for the site.
--
-- Re-includes the 0007 policies (payments/invoices/notifications) because that
-- migration didn't take on the live project; all statements are idempotent, so
-- running this once brings everything to the intended state.

-- ---------------------------------------------------------------------------
-- Admin can read the money tables (was 0007)
-- ---------------------------------------------------------------------------

drop policy if exists "payments admin all" on public.payments;
create policy "payments admin all"
  on public.payments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "invoices admin all" on public.invoices;
create policy "invoices admin all"
  on public.invoices for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "notifications admin read" on public.notifications;
create policy "notifications admin read"
  on public.notifications for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Galleries — admin manages delivery
-- ---------------------------------------------------------------------------
-- The gallery is delivered as an external link the customer opens directly, so
-- no public read policy is needed here — only the admin writes the link.

drop policy if exists "galleries admin all" on public.galleries;
create policy "galleries admin all"
  on public.galleries for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Reviews — public submit, public read approved, admin moderate
-- ---------------------------------------------------------------------------
-- Display fields so an approved review can be shown on the site without reading
-- the bookings table (which would leak customer contact details).
alter table public.reviews
  add column if not exists reviewer_name text not null default '',
  add column if not exists meta          text not null default '',
  add column if not exists instagram     text not null default '';

drop policy if exists "reviews public submit" on public.reviews;
create policy "reviews public submit"
  on public.reviews for insert to anon, authenticated
  with check (
    -- A customer may only submit a pending review. They cannot self-approve,
    -- and the unique booking_id means one review per booking limits spam.
    status = 'pending'
    and rating between 1 and 5
  );

drop policy if exists "reviews public read approved" on public.reviews;
create policy "reviews public read approved"
  on public.reviews for select to anon, authenticated
  using (status = 'approved');

drop policy if exists "reviews admin all" on public.reviews;
create policy "reviews admin all"
  on public.reviews for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
